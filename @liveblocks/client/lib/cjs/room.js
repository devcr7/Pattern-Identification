"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoom = exports.defaultState = exports.makeStateMachine = void 0;
const utils_1 = require("./utils");
const authentication_1 = __importStar(require("./authentication"));
const live_1 = require("./live");
const LiveMap_1 = require("./LiveMap");
const LiveObject_1 = require("./LiveObject");
const LiveList_1 = require("./LiveList");
const AbstractCrdt_1 = require("./AbstractCrdt");
const LiveRegister_1 = require("./LiveRegister");
const BACKOFF_RETRY_DELAYS = [250, 500, 1000, 2000, 4000, 8000, 10000];
const HEARTBEAT_INTERVAL = 30000;
// const WAKE_UP_CHECK_INTERVAL = 2000;
const PONG_TIMEOUT = 2000;
function isValidRoomEventType(value) {
    return (value === "my-presence" ||
        value === "others" ||
        value === "event" ||
        value === "error" ||
        value === "connection");
}
function makeIdFactory(connectionId) {
    let count = 0;
    return () => `${connectionId}:${count++}`;
}
function makeOthers(presenceMap) {
    const array = Object.values(presenceMap);
    return {
        get count() {
            return array.length;
        },
        [Symbol.iterator]() {
            return array[Symbol.iterator]();
        },
        map(callback) {
            return array.map(callback);
        },
        toArray() {
            return array;
        },
    };
}
function log(...params) {
    return;
    console.log(...params, new Date().toString());
}
function makeStateMachine(state, context, mockedEffects) {
    const effects = mockedEffects || {
        authenticate() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const token = yield (0, authentication_1.default)(context.authEndpoint, context.room, context.publicApiKey);
                    const parsedToken = (0, authentication_1.parseToken)(token);
                    const socket = new WebSocket(`${context.liveblocksServer}/?token=${token}`);
                    socket.addEventListener("message", onMessage);
                    socket.addEventListener("open", onOpen);
                    socket.addEventListener("close", onClose);
                    socket.addEventListener("error", onError);
                    authenticationSuccess(parsedToken, socket);
                }
                catch (er) {
                    authenticationFailure(er);
                }
            });
        },
        send(messageOrMessages) {
            if (state.socket == null) {
                throw new Error("Can't send message if socket is null");
            }
            state.socket.send(JSON.stringify(messageOrMessages));
        },
        delayFlush(delay) {
            return setTimeout(tryFlushing, delay);
        },
        startHeartbeatInterval() {
            return setInterval(heartbeat, HEARTBEAT_INTERVAL);
        },
        schedulePongTimeout() {
            return setTimeout(pongTimeout, PONG_TIMEOUT);
        },
        scheduleReconnect(delay) {
            return setTimeout(connect, delay);
        },
    };
    function genericSubscribe(callback) {
        state.listeners.storage.push(callback);
        return () => (0, utils_1.remove)(state.listeners.storage, callback);
    }
    function crdtSubscribe(crdt, innerCallback, options) {
        const cb = (updates) => {
            const relatedUpdates = [];
            for (const update of updates) {
                if ((options === null || options === void 0 ? void 0 : options.isDeep) && (0, utils_1.isSameNodeOrChildOf)(update.node, crdt)) {
                    relatedUpdates.push(update);
                }
                else if (update.node._id === crdt._id) {
                    innerCallback(update.node);
                }
            }
            if ((options === null || options === void 0 ? void 0 : options.isDeep) && relatedUpdates.length > 0) {
                innerCallback(relatedUpdates);
            }
        };
        return genericSubscribe(cb);
    }
    function createOrUpdateRootFromMessage(message) {
        if (message.items.length === 0) {
            throw new Error("Internal error: cannot load storage without items");
        }
        if (state.root) {
            updateRoot(message.items);
        }
        else {
            state.root = load(message.items);
        }
        for (const key in state.defaultStorageRoot) {
            if (state.root.get(key) == null) {
                state.root.set(key, state.defaultStorageRoot[key]);
            }
        }
    }
    function buildRootAndParentToChildren(items) {
        const parentToChildren = new Map();
        let root = null;
        for (const tuple of items) {
            const parentId = tuple[1].parentId;
            if (parentId == null) {
                root = tuple;
            }
            else {
                const children = parentToChildren.get(parentId);
                if (children != null) {
                    children.push(tuple);
                }
                else {
                    parentToChildren.set(parentId, [tuple]);
                }
            }
        }
        if (root == null) {
            throw new Error("Root can't be null");
        }
        return [root, parentToChildren];
    }
    function updateRoot(items) {
        if (!state.root) {
            return;
        }
        const currentItems = new Map();
        state.items.forEach((liveCrdt, id) => {
            currentItems.set(id, liveCrdt._toSerializedCrdt());
        });
        // Get operations that represent the diff between 2 states.
        const ops = (0, utils_1.getTreesDiffOperations)(currentItems, new Map(items));
        const result = apply(ops, false);
        notify(result.updates);
    }
    function load(items) {
        const [root, parentToChildren] = buildRootAndParentToChildren(items);
        return LiveObject_1.LiveObject._deserialize(root, parentToChildren, {
            addItem,
            deleteItem,
            generateId,
            generateOpId,
            dispatch: storageDispatch,
        });
    }
    function addItem(id, item) {
        state.items.set(id, item);
    }
    function deleteItem(id) {
        state.items.delete(id);
    }
    function getItem(id) {
        return state.items.get(id);
    }
    function addToUndoStack(historyItem) {
        // If undo stack is too large, we remove the older item
        if (state.undoStack.length >= 50) {
            state.undoStack.shift();
        }
        if (state.isHistoryPaused) {
            state.pausedHistory.unshift(...historyItem);
        }
        else {
            state.undoStack.push(historyItem);
        }
    }
    function storageDispatch(ops, reverse, modified) {
        if (state.isBatching) {
            state.batch.ops.push(...ops);
            for (const item of modified) {
                state.batch.updates.nodes.add(item);
            }
            state.batch.reverseOps.push(...reverse);
        }
        else {
            addToUndoStack(reverse);
            state.redoStack = [];
            dispatch(ops);
            notify({ nodes: new Set(modified) });
        }
    }
    function notify({ nodes = new Set(), presence = false, others = [], }) {
        if (others.length > 0) {
            state.others = makeOthers(state.users);
            for (const event of others) {
                for (const listener of state.listeners["others"]) {
                    listener(state.others, event);
                }
            }
        }
        if (presence) {
            for (const listener of state.listeners["my-presence"]) {
                listener(state.me);
            }
        }
        if (nodes.size > 0) {
            for (const subscriber of state.listeners.storage) {
                subscriber(Array.from(nodes).map((m) => {
                    if (m instanceof LiveObject_1.LiveObject) {
                        return {
                            type: "LiveObject",
                            node: m,
                        };
                    }
                    else if (m instanceof LiveList_1.LiveList) {
                        return {
                            type: "LiveList",
                            node: m,
                        };
                    }
                    else {
                        return {
                            type: "LiveMap",
                            node: m,
                        };
                    }
                }));
            }
        }
    }
    function getConnectionId() {
        if (state.connection.state === "open" ||
            state.connection.state === "connecting") {
            return state.connection.id;
        }
        else if (state.lastConnectionId !== null) {
            return state.lastConnectionId;
        }
        throw new Error("Internal. Tried to get connection id but connection was never open");
    }
    function generateId() {
        return `${getConnectionId()}:${state.clock++}`;
    }
    function generateOpId() {
        return `${getConnectionId()}:${state.opClock++}`;
    }
    function apply(item, isLocal) {
        const result = {
            reverse: [],
            updates: { nodes: new Set(), presence: false },
        };
        for (const op of item) {
            if (op.type === "presence") {
                const reverse = {
                    type: "presence",
                    data: {},
                };
                for (const key in op.data) {
                    reverse.data[key] = state.me[key];
                }
                state.me = Object.assign(Object.assign({}, state.me), op.data);
                if (state.buffer.presence == null) {
                    state.buffer.presence = op.data;
                }
                else {
                    for (const key in op.data) {
                        state.buffer.presence[key] = op.data;
                    }
                }
                result.reverse.unshift(reverse);
                result.updates.presence = true;
            }
            else {
                // Ops applied after undo/redo don't have an opId.
                if (isLocal && !op.opId) {
                    op.opId = generateOpId();
                }
                const applyOpResult = applyOp(op, isLocal);
                if (applyOpResult.modified) {
                    result.updates.nodes.add(applyOpResult.modified);
                    result.reverse.unshift(...applyOpResult.reverse);
                }
            }
        }
        return result;
    }
    function applyOp(op, isLocal) {
        if (op.opId) {
            state.offlineOperations.delete(op.opId);
        }
        switch (op.type) {
            case live_1.OpType.DeleteObjectKey:
            case live_1.OpType.UpdateObject:
            case live_1.OpType.DeleteCrdt: {
                const item = state.items.get(op.id);
                if (item == null) {
                    return { modified: false };
                }
                return item._apply(op, isLocal);
            }
            case live_1.OpType.SetParentKey: {
                const item = state.items.get(op.id);
                if (item == null) {
                    return { modified: false };
                }
                if (item._parent instanceof LiveList_1.LiveList) {
                    const previousKey = item._parentKey;
                    item._parent._setChildKey(op.parentKey, item);
                    return {
                        reverse: [
                            {
                                type: live_1.OpType.SetParentKey,
                                id: item._id,
                                parentKey: previousKey,
                            },
                        ],
                        modified: item._parent,
                    };
                }
                return { modified: false };
            }
            case live_1.OpType.CreateObject: {
                const parent = state.items.get(op.parentId);
                if (parent == null || getItem(op.id) != null) {
                    return { modified: false };
                }
                return parent._attachChild(op.id, op.parentKey, new LiveObject_1.LiveObject(op.data), isLocal);
            }
            case live_1.OpType.CreateList: {
                const parent = state.items.get(op.parentId);
                if (parent == null || getItem(op.id) != null) {
                    return { modified: false };
                }
                return parent._attachChild(op.id, op.parentKey, new LiveList_1.LiveList(), isLocal);
            }
            case live_1.OpType.CreateRegister: {
                const parent = state.items.get(op.parentId);
                if (parent == null || getItem(op.id) != null) {
                    return { modified: false };
                }
                return parent._attachChild(op.id, op.parentKey, new LiveRegister_1.LiveRegister(op.data), isLocal);
            }
            case live_1.OpType.CreateMap: {
                const parent = state.items.get(op.parentId);
                if (parent == null || getItem(op.id) != null) {
                    return { modified: false };
                }
                return parent._attachChild(op.id, op.parentKey, new LiveMap_1.LiveMap(), isLocal);
            }
        }
        return { modified: false };
    }
    function subscribe(firstParam, listener, options) {
        if (firstParam instanceof AbstractCrdt_1.AbstractCrdt) {
            return crdtSubscribe(firstParam, listener, options);
        }
        else if (typeof firstParam === "function") {
            return genericSubscribe(firstParam);
        }
        else if (!isValidRoomEventType(firstParam)) {
            throw new Error(`"${firstParam}" is not a valid event name`);
        }
        state.listeners[firstParam].push(listener);
        return () => {
            const callbacks = state.listeners[firstParam];
            (0, utils_1.remove)(callbacks, listener);
        };
    }
    function unsubscribe(event, callback) {
        console.warn(`unsubscribe is depreacted and will be removed in a future version.
use the callback returned by subscribe instead.
See v0.13 release notes for more information.
`);
        if (!isValidRoomEventType(event)) {
            throw new Error(`"${event}" is not a valid event name`);
        }
        const callbacks = state.listeners[event];
        (0, utils_1.remove)(callbacks, callback);
    }
    function getConnectionState() {
        return state.connection.state;
    }
    function getSelf() {
        return state.connection.state === "open" ||
            state.connection.state === "connecting"
            ? {
                connectionId: state.connection.id,
                id: state.connection.userId,
                info: state.connection.userInfo,
                presence: getPresence(),
            }
            : null;
    }
    function connect() {
        if (typeof window === "undefined") {
            return;
        }
        if (state.connection.state !== "closed" &&
            state.connection.state !== "unavailable") {
            return null;
        }
        updateConnection({ state: "authenticating" });
        effects.authenticate();
    }
    function updatePresence(overrides, options) {
        const oldValues = {};
        if (state.buffer.presence == null) {
            state.buffer.presence = {};
        }
        for (const key in overrides) {
            state.buffer.presence[key] = overrides[key];
            oldValues[key] = state.me[key];
        }
        state.me = Object.assign(Object.assign({}, state.me), overrides);
        if (state.isBatching) {
            if (options === null || options === void 0 ? void 0 : options.addToHistory) {
                state.batch.reverseOps.push({ type: "presence", data: oldValues });
            }
            state.batch.updates.presence = true;
        }
        else {
            tryFlushing();
            if (options === null || options === void 0 ? void 0 : options.addToHistory) {
                addToUndoStack([{ type: "presence", data: oldValues }]);
            }
            notify({ presence: true });
        }
    }
    function authenticationSuccess(token, socket) {
        updateConnection({
            state: "connecting",
            id: token.actor,
            userInfo: token.info,
            userId: token.id,
        });
        state.idFactory = makeIdFactory(token.actor);
        state.socket = socket;
    }
    function authenticationFailure(error) {
        if (process.env.NODE_ENV !== "production") {
            console.error("Call to authentication endpoint failed", error);
        }
        updateConnection({ state: "unavailable" });
        state.numberOfRetry++;
        state.timeoutHandles.reconnect = effects.scheduleReconnect(getRetryDelay());
    }
    function onVisibilityChange(visibilityState) {
        if (visibilityState === "visible" && state.connection.state === "open") {
            log("Heartbeat after visibility change");
            heartbeat();
        }
    }
    function onUpdatePresenceMessage(message) {
        const user = state.users[message.actor];
        if (user == null) {
            state.users[message.actor] = {
                connectionId: message.actor,
                presence: message.data,
            };
        }
        else {
            state.users[message.actor] = {
                id: user.id,
                info: user.info,
                connectionId: message.actor,
                presence: Object.assign(Object.assign({}, user.presence), message.data),
            };
        }
        return {
            type: "update",
            updates: message.data,
            user: state.users[message.actor],
        };
    }
    function onUserLeftMessage(message) {
        const userLeftMessage = message;
        const user = state.users[userLeftMessage.actor];
        if (user) {
            delete state.users[userLeftMessage.actor];
            return { type: "leave", user };
        }
        return null;
    }
    function onRoomStateMessage(message) {
        const newUsers = {};
        for (const key in message.users) {
            const connectionId = Number.parseInt(key);
            const user = message.users[key];
            newUsers[connectionId] = {
                connectionId,
                info: user.info,
                id: user.id,
            };
        }
        state.users = newUsers;
        return { type: "reset" };
    }
    function onNavigatorOnline() {
        if (state.connection.state === "unavailable") {
            log("Try to reconnect after connectivity change");
            reconnect();
        }
    }
    function onEvent(message) {
        for (const listener of state.listeners.event) {
            listener({ connectionId: message.actor, event: message.event });
        }
    }
    function onUserJoinedMessage(message) {
        state.users[message.actor] = {
            connectionId: message.actor,
            info: message.info,
            id: message.id,
        };
        if (state.me) {
            // Send current presence to new user
            // TODO: Consider storing it on the backend
            state.buffer.messages.push({
                type: live_1.ClientMessageType.UpdatePresence,
                data: state.me,
                targetActor: message.actor,
            });
            tryFlushing();
        }
        return { type: "enter", user: state.users[message.actor] };
    }
    function onMessage(event) {
        if (event.data === "pong") {
            clearTimeout(state.timeoutHandles.pongTimeout);
            return;
        }
        const message = JSON.parse(event.data);
        let subMessages = [];
        if (Array.isArray(message)) {
            subMessages = message;
        }
        else {
            subMessages.push(message);
        }
        const updates = {
            nodes: new Set(),
            others: [],
        };
        for (const subMessage of subMessages) {
            switch (subMessage.type) {
                case live_1.ServerMessageType.UserJoined: {
                    updates.others.push(onUserJoinedMessage(message));
                    break;
                }
                case live_1.ServerMessageType.UpdatePresence: {
                    updates.others.push(onUpdatePresenceMessage(subMessage));
                    break;
                }
                case live_1.ServerMessageType.Event: {
                    onEvent(subMessage);
                    break;
                }
                case live_1.ServerMessageType.UserLeft: {
                    const event = onUserLeftMessage(subMessage);
                    if (event) {
                        updates.others.push(event);
                    }
                    break;
                }
                case live_1.ServerMessageType.RoomState: {
                    updates.others.push(onRoomStateMessage(subMessage));
                    break;
                }
                case live_1.ServerMessageType.InitialStorageState: {
                    createOrUpdateRootFromMessage(subMessage);
                    applyAndSendOfflineOps();
                    _getInitialStateResolver === null || _getInitialStateResolver === void 0 ? void 0 : _getInitialStateResolver();
                    break;
                }
                case live_1.ServerMessageType.UpdateStorage: {
                    const applyResult = apply(subMessage.ops, false);
                    for (const node of applyResult.updates.nodes) {
                        updates.nodes.add(node);
                    }
                    break;
                }
            }
        }
        notify(updates);
    }
    // function onWakeUp() {
    //   // Sometimes, the browser can put the webpage on pause (computer is on sleep mode for example)
    //   // The client will not know that the server has probably close the connection even if the readyState is Open
    //   // One way to detect this kind of pause is to ensure that a setInterval is not taking more than the delay it was configured with
    //   if (state.connection.state === "open") {
    //     log("Try to reconnect after laptop wake up");
    //     reconnect();
    //   }
    // }
    function onClose(event) {
        state.socket = null;
        clearTimeout(state.timeoutHandles.pongTimeout);
        clearInterval(state.intervalHandles.heartbeat);
        if (state.timeoutHandles.flush) {
            clearTimeout(state.timeoutHandles.flush);
        }
        clearTimeout(state.timeoutHandles.reconnect);
        state.users = {};
        notify({ others: [{ type: "reset" }] });
        if (event.code >= 4000 && event.code <= 4100) {
            updateConnection({ state: "failed" });
            const error = new LiveblocksError(event.reason, event.code);
            for (const listener of state.listeners.error) {
                if (process.env.NODE_ENV !== "production") {
                    console.error(`Connection to Liveblocks websocket server closed. Reason: ${error.message} (code: ${error.code})`);
                }
                listener(error);
            }
        }
        else if (event.wasClean === false) {
            state.numberOfRetry++;
            const delay = getRetryDelay();
            if (process.env.NODE_ENV !== "production") {
                console.warn(`Connection to Liveblocks websocket server closed (code: ${event.code}). Retrying in ${delay}ms.`);
            }
            updateConnection({ state: "unavailable" });
            state.timeoutHandles.reconnect = effects.scheduleReconnect(delay);
        }
        else {
            updateConnection({ state: "closed" });
        }
    }
    function updateConnection(connection) {
        state.connection = connection;
        for (const listener of state.listeners.connection) {
            listener(connection.state);
        }
    }
    function getRetryDelay() {
        return BACKOFF_RETRY_DELAYS[state.numberOfRetry < BACKOFF_RETRY_DELAYS.length
            ? state.numberOfRetry
            : BACKOFF_RETRY_DELAYS.length - 1];
    }
    function onError() { }
    function onOpen() {
        clearInterval(state.intervalHandles.heartbeat);
        state.intervalHandles.heartbeat = effects.startHeartbeatInterval();
        if (state.connection.state === "connecting") {
            updateConnection(Object.assign(Object.assign({}, state.connection), { state: "open" }));
            state.numberOfRetry = 0;
            state.lastConnectionId = state.connection.id;
            if (state.root) {
                state.buffer.messages.push({ type: live_1.ClientMessageType.FetchStorage });
            }
            tryFlushing();
        }
        else {
            // TODO
        }
    }
    function heartbeat() {
        if (state.socket == null) {
            // Should never happen, because we clear the pong timeout when the connection is dropped explictly
            return;
        }
        clearTimeout(state.timeoutHandles.pongTimeout);
        state.timeoutHandles.pongTimeout = effects.schedulePongTimeout();
        if (state.socket.readyState === WebSocket.OPEN) {
            state.socket.send("ping");
        }
    }
    function pongTimeout() {
        log("Pong timeout. Trying to reconnect.");
        reconnect();
    }
    function reconnect() {
        if (state.socket) {
            state.socket.removeEventListener("open", onOpen);
            state.socket.removeEventListener("message", onMessage);
            state.socket.removeEventListener("close", onClose);
            state.socket.removeEventListener("error", onError);
            state.socket.close();
            state.socket = null;
        }
        updateConnection({ state: "unavailable" });
        clearTimeout(state.timeoutHandles.pongTimeout);
        if (state.timeoutHandles.flush) {
            clearTimeout(state.timeoutHandles.flush);
        }
        clearTimeout(state.timeoutHandles.reconnect);
        clearInterval(state.intervalHandles.heartbeat);
        connect();
    }
    function applyAndSendOfflineOps() {
        if (state.offlineOperations.size === 0) {
            return;
        }
        const messages = [];
        const ops = Array.from(state.offlineOperations.values());
        const result = apply(ops, true);
        messages.push({
            type: live_1.ClientMessageType.UpdateStorage,
            ops: ops,
        });
        notify(result.updates);
        effects.send(messages);
    }
    function tryFlushing() {
        const storageOps = state.buffer.storageOperations;
        if (storageOps.length > 0) {
            storageOps.forEach((op) => {
                state.offlineOperations.set(op.opId, op);
            });
        }
        if (state.socket == null || state.socket.readyState !== WebSocket.OPEN) {
            state.buffer.storageOperations = [];
            return;
        }
        const now = Date.now();
        const elapsedTime = now - state.lastFlushTime;
        if (elapsedTime > context.throttleDelay) {
            const messages = flushDataToMessages(state);
            if (messages.length === 0) {
                return;
            }
            effects.send(messages);
            state.buffer = {
                messages: [],
                storageOperations: [],
                presence: null,
            };
            state.lastFlushTime = now;
        }
        else {
            if (state.timeoutHandles.flush != null) {
                clearTimeout(state.timeoutHandles.flush);
            }
            state.timeoutHandles.flush = effects.delayFlush(context.throttleDelay - (now - state.lastFlushTime));
        }
    }
    function flushDataToMessages(state) {
        const messages = [];
        if (state.buffer.presence) {
            messages.push({
                type: live_1.ClientMessageType.UpdatePresence,
                data: state.buffer.presence,
            });
        }
        for (const event of state.buffer.messages) {
            messages.push(event);
        }
        if (state.buffer.storageOperations.length > 0) {
            messages.push({
                type: live_1.ClientMessageType.UpdateStorage,
                ops: state.buffer.storageOperations,
            });
        }
        return messages;
    }
    function disconnect() {
        if (state.socket) {
            state.socket.removeEventListener("open", onOpen);
            state.socket.removeEventListener("message", onMessage);
            state.socket.removeEventListener("close", onClose);
            state.socket.removeEventListener("error", onError);
            state.socket.close();
            state.socket = null;
        }
        updateConnection({ state: "closed" });
        if (state.timeoutHandles.flush) {
            clearTimeout(state.timeoutHandles.flush);
        }
        clearTimeout(state.timeoutHandles.reconnect);
        clearTimeout(state.timeoutHandles.pongTimeout);
        clearInterval(state.intervalHandles.heartbeat);
        state.users = {};
        notify({ others: [{ type: "reset" }] });
        clearListeners();
    }
    function clearListeners() {
        for (const key in state.listeners) {
            state.listeners[key] = [];
        }
    }
    function getPresence() {
        return state.me;
    }
    function getOthers() {
        return state.others;
    }
    function broadcastEvent(event, options = {
        shouldQueueEventIfNotReady: false,
    }) {
        if (state.socket == null && options.shouldQueueEventIfNotReady == false) {
            return;
        }
        state.buffer.messages.push({
            type: live_1.ClientMessageType.ClientEvent,
            event,
        });
        tryFlushing();
    }
    function dispatch(ops) {
        state.buffer.storageOperations.push(...ops);
        tryFlushing();
    }
    let _getInitialStatePromise = null;
    let _getInitialStateResolver = null;
    function getStorage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (state.root) {
                return {
                    root: state.root,
                };
            }
            if (_getInitialStatePromise == null) {
                state.buffer.messages.push({ type: live_1.ClientMessageType.FetchStorage });
                tryFlushing();
                _getInitialStatePromise = new Promise((resolve) => (_getInitialStateResolver = resolve));
            }
            yield _getInitialStatePromise;
            return {
                root: state.root,
            };
        });
    }
    function undo() {
        if (state.isBatching) {
            throw new Error("undo is not allowed during a batch");
        }
        const historyItem = state.undoStack.pop();
        if (historyItem == null) {
            return;
        }
        state.isHistoryPaused = false;
        const result = apply(historyItem, true);
        notify(result.updates);
        state.redoStack.push(result.reverse);
        for (const op of historyItem) {
            if (op.type !== "presence") {
                state.buffer.storageOperations.push(op);
            }
        }
        tryFlushing();
    }
    function redo() {
        if (state.isBatching) {
            throw new Error("redo is not allowed during a batch");
        }
        const historyItem = state.redoStack.pop();
        if (historyItem == null) {
            return;
        }
        state.isHistoryPaused = false;
        const result = apply(historyItem, true);
        notify(result.updates);
        state.undoStack.push(result.reverse);
        for (const op of historyItem) {
            if (op.type !== "presence") {
                state.buffer.storageOperations.push(op);
            }
        }
        tryFlushing();
    }
    function batch(callback) {
        if (state.isBatching) {
            throw new Error("batch should not be called during a batch");
        }
        state.isBatching = true;
        try {
            callback();
        }
        finally {
            state.isBatching = false;
            if (state.batch.reverseOps.length > 0) {
                addToUndoStack(state.batch.reverseOps);
            }
            // Clear the redo stack because batch is always called from a local operation
            state.redoStack = [];
            if (state.batch.ops.length > 0) {
                dispatch(state.batch.ops);
            }
            notify(state.batch.updates);
            state.batch = {
                ops: [],
                reverseOps: [],
                updates: {
                    others: [],
                    nodes: new Set(),
                    presence: false,
                },
            };
            tryFlushing();
        }
    }
    function pauseHistory() {
        state.pausedHistory = [];
        state.isHistoryPaused = true;
    }
    function resumeHistory() {
        state.isHistoryPaused = false;
        if (state.pausedHistory.length > 0) {
            addToUndoStack(state.pausedHistory);
        }
        state.pausedHistory = [];
    }
    function simulateSocketClose() {
        if (state.socket) {
            state.socket.close();
        }
    }
    function simulateSendCloseEvent(event) {
        if (state.socket) {
            onClose(event);
        }
    }
    return {
        // Internal
        onOpen,
        onClose,
        onMessage,
        authenticationSuccess,
        heartbeat,
        onNavigatorOnline,
        // Internal dev tools
        simulateSocketClose,
        simulateSendCloseEvent,
        // onWakeUp,
        onVisibilityChange,
        getUndoStack: () => state.undoStack,
        getItemsCount: () => state.items.size,
        // Core
        connect,
        disconnect,
        subscribe,
        unsubscribe,
        // Presence
        updatePresence,
        broadcastEvent,
        batch,
        undo,
        redo,
        pauseHistory,
        resumeHistory,
        getStorage,
        selectors: {
            // Core
            getConnectionState,
            getSelf,
            // Presence
            getPresence,
            getOthers,
        },
    };
}
exports.makeStateMachine = makeStateMachine;
function defaultState(me, defaultStorageRoot) {
    return {
        connection: { state: "closed" },
        lastConnectionId: null,
        socket: null,
        listeners: {
            event: [],
            others: [],
            "my-presence": [],
            error: [],
            connection: [],
            storage: [],
        },
        numberOfRetry: 0,
        lastFlushTime: 0,
        timeoutHandles: {
            flush: null,
            reconnect: 0,
            pongTimeout: 0,
        },
        buffer: {
            presence: me == null ? {} : me,
            messages: [],
            storageOperations: [],
        },
        intervalHandles: {
            heartbeat: 0,
        },
        me: me == null ? {} : me,
        users: {},
        others: makeOthers({}),
        defaultStorageRoot,
        idFactory: null,
        // Storage
        clock: 0,
        opClock: 0,
        items: new Map(),
        root: undefined,
        undoStack: [],
        redoStack: [],
        isHistoryPaused: false,
        pausedHistory: [],
        isBatching: false,
        batch: {
            ops: [],
            updates: { nodes: new Set(), presence: false, others: [] },
            reverseOps: [],
        },
        offlineOperations: new Map(),
    };
}
exports.defaultState = defaultState;
function createRoom(name, options) {
    const throttleDelay = options.throttle || 100;
    const liveblocksServer = options.liveblocksServer || "wss://liveblocks.net/v5";
    let authEndpoint;
    if (options.authEndpoint) {
        authEndpoint = options.authEndpoint;
    }
    else {
        const publicAuthorizeEndpoint = options.publicAuthorizeEndpoint ||
            "https://liveblocks.io/api/public/authorize";
        authEndpoint = publicAuthorizeEndpoint;
    }
    const state = defaultState(options.defaultPresence, options.defaultStorageRoot);
    const machine = makeStateMachine(state, {
        throttleDelay,
        liveblocksServer,
        authEndpoint,
        room: name,
        publicApiKey: options.publicApiKey,
    });
    const room = {
        /////////////
        // Core    //
        /////////////
        getConnectionState: machine.selectors.getConnectionState,
        getSelf: machine.selectors.getSelf,
        subscribe: machine.subscribe,
        unsubscribe: machine.unsubscribe,
        //////////////
        // Presence //
        //////////////
        getPresence: machine.selectors.getPresence,
        updatePresence: machine.updatePresence,
        getOthers: machine.selectors.getOthers,
        broadcastEvent: machine.broadcastEvent,
        getStorage: machine.getStorage,
        batch: machine.batch,
        history: {
            undo: machine.undo,
            redo: machine.redo,
            pause: machine.pauseHistory,
            resume: machine.resumeHistory,
        },
        // @ts-ignore
        internalDevTools: {
            closeWebsocket: machine.simulateSocketClose,
            sendCloseEvent: machine.simulateSendCloseEvent,
        },
    };
    return {
        connect: machine.connect,
        disconnect: machine.disconnect,
        onNavigatorOnline: machine.onNavigatorOnline,
        onVisibilityChange: machine.onVisibilityChange,
        room,
    };
}
exports.createRoom = createRoom;
class LiveblocksError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}
