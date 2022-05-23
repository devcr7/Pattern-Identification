"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LiveMap_map;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveMap = void 0;
const AbstractCrdt_1 = require("./AbstractCrdt");
const utils_1 = require("./utils");
const live_1 = require("./live");
/**
 * The LiveMap class is similar to a JavaScript Map that is synchronized on all clients.
 * Keys should be a string, and values should be serializable to JSON.
 * If multiple clients update the same property simultaneously, the last modification received by the Liveblocks servers is the winner.
 */
class LiveMap extends AbstractCrdt_1.AbstractCrdt {
    constructor(entries) {
        super();
        _LiveMap_map.set(this, void 0);
        if (entries) {
            const mappedEntries = [];
            for (const entry of entries) {
                const value = (0, utils_1.selfOrRegister)(entry[1]);
                value._setParentLink(this, entry[0]);
                mappedEntries.push([entry[0], value]);
            }
            __classPrivateFieldSet(this, _LiveMap_map, new Map(mappedEntries), "f");
        }
        else {
            __classPrivateFieldSet(this, _LiveMap_map, new Map(), "f");
        }
    }
    /**
     * INTERNAL
     */
    _serialize(parentId, parentKey, doc) {
        if (this._id == null) {
            throw new Error("Cannot serialize item is not attached");
        }
        if (parentId == null || parentKey == null) {
            throw new Error("Cannot serialize map if parentId or parentKey is undefined");
        }
        const ops = [];
        const op = {
            id: this._id,
            opId: doc === null || doc === void 0 ? void 0 : doc.generateOpId(),
            type: live_1.OpType.CreateMap,
            parentId,
            parentKey,
        };
        ops.push(op);
        for (const [key, value] of __classPrivateFieldGet(this, _LiveMap_map, "f")) {
            ops.push(...value._serialize(this._id, key, doc));
        }
        return ops;
    }
    /**
     * INTERNAL
     */
    static _deserialize([id, item], parentToChildren, doc) {
        if (item.type !== live_1.CrdtType.Map) {
            throw new Error(`Tried to deserialize a map but item type is "${item.type}"`);
        }
        const map = new LiveMap();
        map._attach(id, doc);
        const children = parentToChildren.get(id);
        if (children == null) {
            return map;
        }
        for (const entry of children) {
            const crdt = entry[1];
            if (crdt.parentKey == null) {
                throw new Error("Tried to deserialize a crdt but it does not have a parentKey and is not the root");
            }
            const child = (0, utils_1.deserialize)(entry, parentToChildren, doc);
            child._setParentLink(map, crdt.parentKey);
            __classPrivateFieldGet(map, _LiveMap_map, "f").set(crdt.parentKey, child);
        }
        return map;
    }
    /**
     * INTERNAL
     */
    _attach(id, doc) {
        super._attach(id, doc);
        for (const [key, value] of __classPrivateFieldGet(this, _LiveMap_map, "f")) {
            if ((0, utils_1.isCrdt)(value)) {
                value._attach(doc.generateId(), doc);
            }
        }
    }
    /**
     * INTERNAL
     */
    _attachChild(id, key, child, isLocal) {
        if (this._doc == null) {
            throw new Error("Can't attach child if doc is not present");
        }
        const previousValue = __classPrivateFieldGet(this, _LiveMap_map, "f").get(key);
        let reverse;
        if (previousValue) {
            reverse = previousValue._serialize(this._id, key);
            previousValue._detach();
        }
        else {
            reverse = [{ type: live_1.OpType.DeleteCrdt, id }];
        }
        child._setParentLink(this, key);
        child._attach(id, this._doc);
        __classPrivateFieldGet(this, _LiveMap_map, "f").set(key, child);
        return { modified: this, reverse };
    }
    /**
     * INTERNAL
     */
    _detach() {
        super._detach();
        for (const item of __classPrivateFieldGet(this, _LiveMap_map, "f").values()) {
            item._detach();
        }
    }
    /**
     * INTERNAL
     */
    _detachChild(child) {
        for (const [key, value] of __classPrivateFieldGet(this, _LiveMap_map, "f")) {
            if (value === child) {
                __classPrivateFieldGet(this, _LiveMap_map, "f").delete(key);
            }
        }
        child._detach();
    }
    /**
     * INTERNAL
     */
    _toSerializedCrdt() {
        var _a;
        return {
            type: live_1.CrdtType.Map,
            parentId: (_a = this._parent) === null || _a === void 0 ? void 0 : _a._id,
            parentKey: this._parentKey,
        };
    }
    /**
     * Returns a specified element from the LiveMap.
     * @param key The key of the element to return.
     * @returns The element associated with the specified key, or undefined if the key can't be found in the LiveMap.
     */
    get(key) {
        const value = __classPrivateFieldGet(this, _LiveMap_map, "f").get(key);
        if (value == undefined) {
            return undefined;
        }
        return (0, utils_1.selfOrRegisterValue)(value);
    }
    /**
     * Adds or updates an element with a specified key and a value.
     * @param key The key of the element to add. Should be a string.
     * @param value The value of the element to add. Should be serializable to JSON.
     */
    set(key, value) {
        const oldValue = __classPrivateFieldGet(this, _LiveMap_map, "f").get(key);
        if (oldValue) {
            oldValue._detach();
        }
        const item = (0, utils_1.selfOrRegister)(value);
        item._setParentLink(this, key);
        __classPrivateFieldGet(this, _LiveMap_map, "f").set(key, item);
        if (this._doc && this._id) {
            const id = this._doc.generateId();
            item._attach(id, this._doc);
            this._doc.dispatch(item._serialize(this._id, key, this._doc), oldValue
                ? oldValue._serialize(this._id, key)
                : [{ type: live_1.OpType.DeleteCrdt, id }], [this]);
        }
    }
    /**
     * Returns the number of elements in the LiveMap.
     */
    get size() {
        return __classPrivateFieldGet(this, _LiveMap_map, "f").size;
    }
    /**
     * Returns a boolean indicating whether an element with the specified key exists or not.
     * @param key The key of the element to test for presence.
     */
    has(key) {
        return __classPrivateFieldGet(this, _LiveMap_map, "f").has(key);
    }
    /**
     * Removes the specified element by key.
     * @param key The key of the element to remove.
     * @returns true if an element existed and has been removed, or false if the element does not exist.
     */
    delete(key) {
        const item = __classPrivateFieldGet(this, _LiveMap_map, "f").get(key);
        if (item == null) {
            return false;
        }
        item._detach();
        if (this._doc && item._id) {
            this._doc.dispatch([
                {
                    type: live_1.OpType.DeleteCrdt,
                    id: item._id,
                    opId: this._doc.generateOpId(),
                },
            ], item._serialize(this._id, key), [this]);
        }
        __classPrivateFieldGet(this, _LiveMap_map, "f").delete(key);
        return true;
    }
    /**
     * Returns a new Iterator object that contains the [key, value] pairs for each element.
     */
    entries() {
        const innerIterator = __classPrivateFieldGet(this, _LiveMap_map, "f").entries();
        return {
            [Symbol.iterator]: function () {
                return this;
            },
            next() {
                const iteratorValue = innerIterator.next();
                if (iteratorValue.done) {
                    return {
                        done: true,
                        value: undefined,
                    };
                }
                const entry = iteratorValue.value;
                return {
                    value: [entry[0], (0, utils_1.selfOrRegisterValue)(iteratorValue.value[1])],
                };
            },
        };
    }
    /**
     * Same function object as the initial value of the entries method.
     */
    [(_LiveMap_map = new WeakMap(), Symbol.iterator)]() {
        return this.entries();
    }
    /**
     * Returns a new Iterator object that contains the keys for each element.
     */
    keys() {
        return __classPrivateFieldGet(this, _LiveMap_map, "f").keys();
    }
    /**
     * Returns a new Iterator object that contains the values for each element.
     */
    values() {
        const innerIterator = __classPrivateFieldGet(this, _LiveMap_map, "f").values();
        return {
            [Symbol.iterator]: function () {
                return this;
            },
            next() {
                const iteratorValue = innerIterator.next();
                if (iteratorValue.done) {
                    return {
                        done: true,
                        value: undefined,
                    };
                }
                return {
                    value: (0, utils_1.selfOrRegisterValue)(iteratorValue.value),
                };
            },
        };
    }
    /**
     * Executes a provided function once per each key/value pair in the Map object, in insertion order.
     * @param callback Function to execute for each entry in the map.
     */
    forEach(callback) {
        for (const entry of this) {
            callback(entry[1], entry[0], this);
        }
    }
}
exports.LiveMap = LiveMap;
