import { Others, Presence, ClientOptions, Room, MyPresenceCallback, OthersEventCallback, AuthEndpoint, EventCallback, User, Connection, ErrorCallback, AuthenticationToken, ConnectionCallback, StorageCallback, StorageUpdate, BroadcastOptions } from "./types";
import { ClientMessage, Op } from "./live";
import { LiveMap } from "./LiveMap";
import { LiveObject } from "./LiveObject";
import { LiveList } from "./LiveList";
import { AbstractCrdt } from "./AbstractCrdt";
declare type HistoryItem = Array<Op | {
    type: "presence";
    data: Presence;
}>;
declare type IdFactory = () => string;
export declare type State = {
    connection: Connection;
    lastConnectionId: number | null;
    socket: WebSocket | null;
    lastFlushTime: number;
    buffer: {
        presence: Presence | null;
        messages: ClientMessage[];
        storageOperations: Op[];
    };
    timeoutHandles: {
        flush: number | null;
        reconnect: number;
        pongTimeout: number;
    };
    intervalHandles: {
        heartbeat: number;
    };
    listeners: {
        event: EventCallback[];
        others: OthersEventCallback[];
        "my-presence": MyPresenceCallback[];
        error: ErrorCallback[];
        connection: ConnectionCallback[];
        storage: StorageCallback[];
    };
    me: Presence;
    others: Others;
    users: {
        [connectionId: number]: User;
    };
    idFactory: IdFactory | null;
    numberOfRetry: number;
    defaultStorageRoot?: {
        [key: string]: any;
    };
    clock: number;
    opClock: number;
    items: Map<string, AbstractCrdt>;
    root: LiveObject | undefined;
    undoStack: HistoryItem[];
    redoStack: HistoryItem[];
    isHistoryPaused: boolean;
    pausedHistory: HistoryItem;
    isBatching: boolean;
    batch: {
        ops: Op[];
        reverseOps: HistoryItem;
        updates: {
            others: [];
            presence: boolean;
            nodes: Set<AbstractCrdt>;
        };
    };
    offlineOperations: Map<string, Op>;
};
export declare type Effects = {
    authenticate(): void;
    send(messages: ClientMessage[]): void;
    delayFlush(delay: number): number;
    startHeartbeatInterval(): number;
    schedulePongTimeout(): number;
    scheduleReconnect(delay: number): number;
};
declare type Context = {
    room: string;
    authEndpoint: AuthEndpoint;
    liveblocksServer: string;
    throttleDelay: number;
    publicApiKey?: string;
};
export declare function makeStateMachine(state: State, context: Context, mockedEffects?: Effects): {
    onOpen: () => void;
    onClose: (event: {
        code: number;
        wasClean: boolean;
        reason: any;
    }) => void;
    onMessage: (event: MessageEvent) => void;
    authenticationSuccess: (token: AuthenticationToken, socket: WebSocket) => void;
    heartbeat: () => void;
    onNavigatorOnline: () => void;
    simulateSocketClose: () => void;
    simulateSendCloseEvent: (event: {
        code: number;
        wasClean: boolean;
        reason: any;
    }) => void;
    onVisibilityChange: (visibilityState: VisibilityState) => void;
    getUndoStack: () => HistoryItem[];
    getItemsCount: () => number;
    connect: () => null | undefined;
    disconnect: () => void;
    subscribe: {
        (callback: (updates: StorageUpdate) => void): () => void;
        <TKey extends string, TValue>(liveMap: LiveMap<TKey, TValue>, callback: (liveMap: LiveMap<TKey, TValue>) => void): () => void;
        <TData>(liveObject: LiveObject<TData>, callback: (liveObject: LiveObject<TData>) => void): () => void;
        <TItem>(liveList: LiveList<TItem>, callback: (liveList: LiveList<TItem>) => void): () => void;
        <TItem_1 extends AbstractCrdt>(node: TItem_1, callback: (updates: StorageUpdate[]) => void, options: {
            isDeep: true;
        }): () => void;
        <T extends Presence>(type: "my-presence", listener: MyPresenceCallback<T>): () => void;
        <T_1 extends Presence>(type: "others", listener: OthersEventCallback<T_1>): () => void;
        (type: "event", listener: EventCallback): () => void;
        (type: "error", listener: ErrorCallback): () => void;
        (type: "connection", listener: ConnectionCallback): () => void;
    };
    unsubscribe: {
        <T_2 extends Presence>(type: "my-presence", listener: MyPresenceCallback<T_2>): void;
        <T_3 extends Presence>(type: "others", listener: OthersEventCallback<T_3>): void;
        (type: "event", listener: EventCallback): void;
        (type: "error", listener: ErrorCallback): void;
        (type: "connection", listener: ConnectionCallback): void;
    };
    updatePresence: <T_4 extends Presence>(overrides: Partial<T_4>, options?: {
        addToHistory: boolean;
    } | undefined) => void;
    broadcastEvent: (event: any, options?: BroadcastOptions) => void;
    batch: (callback: () => void) => void;
    undo: () => void;
    redo: () => void;
    pauseHistory: () => void;
    resumeHistory: () => void;
    getStorage: <TRoot>() => Promise<{
        root: LiveObject<TRoot>;
    }>;
    selectors: {
        getConnectionState: () => "failed" | "closed" | "connecting" | "open" | "authenticating" | "unavailable";
        getSelf: <TPresence extends Presence = Presence>() => User<TPresence> | null;
        getPresence: <T_5 extends Presence>() => T_5;
        getOthers: <T_6 extends Presence>() => Others<T_6>;
    };
};
export declare function defaultState(me?: Presence, defaultStorageRoot?: {
    [key: string]: any;
}): State;
export declare type InternalRoom = {
    room: Room;
    connect: () => void;
    disconnect: () => void;
    onNavigatorOnline: () => void;
    onVisibilityChange: (visibilityState: VisibilityState) => void;
};
export declare function createRoom(name: string, options: ClientOptions & {
    defaultPresence?: Presence;
    defaultStorageRoot?: Record<string, any>;
}): InternalRoom;
export {};
