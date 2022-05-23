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
var _LiveObject_instances, _LiveObject_map, _LiveObject_propToLastUpdate, _LiveObject_applyUpdate, _LiveObject_applyDeleteObjectKey;
import { AbstractCrdt } from "./AbstractCrdt";
import { deserialize, isCrdt } from "./utils";
import { CrdtType, OpType, } from "./live";
/**
 * The LiveObject class is similar to a JavaScript object that is synchronized on all clients.
 * Keys should be a string, and values should be serializable to JSON.
 * If multiple clients update the same property simultaneously, the last modification received by the Liveblocks servers is the winner.
 */
export class LiveObject extends AbstractCrdt {
    constructor(object = {}) {
        super();
        _LiveObject_instances.add(this);
        _LiveObject_map.set(this, void 0);
        _LiveObject_propToLastUpdate.set(this, new Map());
        for (const key in object) {
            const value = object[key];
            if (value instanceof AbstractCrdt) {
                value._setParentLink(this, key);
            }
        }
        __classPrivateFieldSet(this, _LiveObject_map, new Map(Object.entries(object)), "f");
    }
    /**
     * INTERNAL
     */
    _serialize(parentId, parentKey, doc) {
        if (this._id == null) {
            throw new Error("Cannot serialize item is not attached");
        }
        const ops = [];
        const op = {
            id: this._id,
            opId: doc === null || doc === void 0 ? void 0 : doc.generateOpId(),
            type: OpType.CreateObject,
            parentId,
            parentKey,
            data: {},
        };
        ops.push(op);
        for (const [key, value] of __classPrivateFieldGet(this, _LiveObject_map, "f")) {
            if (value instanceof AbstractCrdt) {
                ops.push(...value._serialize(this._id, key, doc));
            }
            else {
                op.data[key] = value;
            }
        }
        return ops;
    }
    /**
     * INTERNAL
     */
    static _deserialize([id, item], parentToChildren, doc) {
        if (item.type !== CrdtType.Object) {
            throw new Error(`Tried to deserialize a record but item type is "${item.type}"`);
        }
        const object = new LiveObject(item.data);
        object._attach(id, doc);
        return this._deserializeChildren(object, parentToChildren, doc);
    }
    /**
     * INTERNAL
     */
    static _deserializeChildren(object, parentToChildren, doc) {
        const children = parentToChildren.get(object._id);
        if (children == null) {
            return object;
        }
        for (const entry of children) {
            const crdt = entry[1];
            if (crdt.parentKey == null) {
                throw new Error("Tried to deserialize a crdt but it does not have a parentKey and is not the root");
            }
            const child = deserialize(entry, parentToChildren, doc);
            child._setParentLink(object, crdt.parentKey);
            __classPrivateFieldGet(object, _LiveObject_map, "f").set(crdt.parentKey, child);
        }
        return object;
    }
    /**
     * INTERNAL
     */
    _attach(id, doc) {
        super._attach(id, doc);
        for (const [key, value] of __classPrivateFieldGet(this, _LiveObject_map, "f")) {
            if (value instanceof AbstractCrdt) {
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
        const previousValue = __classPrivateFieldGet(this, _LiveObject_map, "f").get(key);
        let reverse;
        if (isCrdt(previousValue)) {
            reverse = previousValue._serialize(this._id, key);
            previousValue._detach();
        }
        else if (previousValue === undefined) {
            reverse = [
                { type: OpType.DeleteObjectKey, id: this._id, key: key },
            ];
        }
        else {
            reverse = [
                {
                    type: OpType.UpdateObject,
                    id: this._id,
                    data: { [key]: previousValue },
                },
            ];
        }
        __classPrivateFieldGet(this, _LiveObject_map, "f").set(key, child);
        child._setParentLink(this, key);
        child._attach(id, this._doc);
        return { reverse, modified: this };
    }
    /**
     * INTERNAL
     */
    _detachChild(child) {
        for (const [key, value] of __classPrivateFieldGet(this, _LiveObject_map, "f")) {
            if (value === child) {
                __classPrivateFieldGet(this, _LiveObject_map, "f").delete(key);
            }
        }
        if (child) {
            child._detach();
        }
    }
    /**
     * INTERNAL
     */
    _detachChildren() {
        for (const [key, value] of __classPrivateFieldGet(this, _LiveObject_map, "f")) {
            __classPrivateFieldGet(this, _LiveObject_map, "f").delete(key);
            value._detach();
        }
    }
    /**
     * INTERNAL
     */
    _detach() {
        super._detach();
        for (const value of __classPrivateFieldGet(this, _LiveObject_map, "f").values()) {
            if (isCrdt(value)) {
                value._detach();
            }
        }
    }
    /**
     * INTERNAL
     */
    _apply(op, isLocal) {
        if (op.type === OpType.UpdateObject) {
            return __classPrivateFieldGet(this, _LiveObject_instances, "m", _LiveObject_applyUpdate).call(this, op, isLocal);
        }
        else if (op.type === OpType.DeleteObjectKey) {
            return __classPrivateFieldGet(this, _LiveObject_instances, "m", _LiveObject_applyDeleteObjectKey).call(this, op);
        }
        return super._apply(op, isLocal);
    }
    /**
     * INTERNAL
     */
    _toSerializedCrdt() {
        var _a;
        return {
            type: CrdtType.Object,
            parentId: (_a = this._parent) === null || _a === void 0 ? void 0 : _a._id,
            parentKey: this._parentKey,
            data: this.toObject(),
        };
    }
    /**
     * Transform the LiveObject into a javascript object
     */
    toObject() {
        return Object.fromEntries(__classPrivateFieldGet(this, _LiveObject_map, "f"));
    }
    /**
     * Adds or updates a property with a specified key and a value.
     * @param key The key of the property to add
     * @param value The value of the property to add
     */
    set(key, value) {
        // TODO: Find out why typescript complains
        this.update({ [key]: value });
    }
    /**
     * Returns a specified property from the LiveObject.
     * @param key The key of the property to get
     */
    get(key) {
        return __classPrivateFieldGet(this, _LiveObject_map, "f").get(key);
    }
    /**
     * Deletes a key from the LiveObject
     * @param key The key of the property to delete
     */
    delete(key) {
        const keyAsString = key;
        const oldValue = __classPrivateFieldGet(this, _LiveObject_map, "f").get(keyAsString);
        if (oldValue === undefined) {
            return;
        }
        if (this._doc == null || this._id == null) {
            if (oldValue instanceof AbstractCrdt) {
                oldValue._detach();
            }
            __classPrivateFieldGet(this, _LiveObject_map, "f").delete(keyAsString);
            return;
        }
        let reverse;
        if (oldValue instanceof AbstractCrdt) {
            oldValue._detach();
            reverse = oldValue._serialize(this._id, keyAsString);
        }
        else {
            reverse = [
                {
                    type: OpType.UpdateObject,
                    data: { [keyAsString]: oldValue },
                    id: this._id,
                },
            ];
        }
        __classPrivateFieldGet(this, _LiveObject_map, "f").delete(keyAsString);
        this._doc.dispatch([
            {
                type: OpType.DeleteObjectKey,
                key: keyAsString,
                id: this._id,
                opId: this._doc.generateOpId(),
            },
        ], reverse, [this]);
    }
    /**
     * Adds or updates multiple properties at once with an object.
     * @param overrides The object used to overrides properties
     */
    update(overrides) {
        if (this._doc == null || this._id == null) {
            for (const key in overrides) {
                const oldValue = __classPrivateFieldGet(this, _LiveObject_map, "f").get(key);
                if (oldValue instanceof AbstractCrdt) {
                    oldValue._detach();
                }
                const newValue = overrides[key];
                if (newValue instanceof AbstractCrdt) {
                    newValue._setParentLink(this, key);
                }
                __classPrivateFieldGet(this, _LiveObject_map, "f").set(key, newValue);
            }
            return;
        }
        const ops = [];
        const reverseOps = [];
        const opId = this._doc.generateOpId();
        const updatedProps = {};
        const reverseUpdateOp = {
            id: this._id,
            type: OpType.UpdateObject,
            data: {},
        };
        for (const key in overrides) {
            __classPrivateFieldGet(this, _LiveObject_propToLastUpdate, "f").set(key, opId);
            const oldValue = __classPrivateFieldGet(this, _LiveObject_map, "f").get(key);
            if (oldValue instanceof AbstractCrdt) {
                reverseOps.push(...oldValue._serialize(this._id, key));
                oldValue._detach();
            }
            else if (oldValue === undefined) {
                reverseOps.push({ type: OpType.DeleteObjectKey, id: this._id, key });
            }
            else {
                reverseUpdateOp.data[key] = oldValue;
            }
            const newValue = overrides[key];
            if (newValue instanceof AbstractCrdt) {
                newValue._setParentLink(this, key);
                newValue._attach(this._doc.generateId(), this._doc);
                ops.push(...newValue._serialize(this._id, key, this._doc));
            }
            else {
                updatedProps[key] = newValue;
            }
            __classPrivateFieldGet(this, _LiveObject_map, "f").set(key, newValue);
        }
        if (Object.keys(reverseUpdateOp.data).length !== 0) {
            reverseOps.unshift(reverseUpdateOp);
        }
        if (Object.keys(updatedProps).length !== 0) {
            ops.unshift({
                opId,
                id: this._id,
                type: OpType.UpdateObject,
                data: updatedProps,
            });
        }
        this._doc.dispatch(ops, reverseOps, [this]);
    }
}
_LiveObject_map = new WeakMap(), _LiveObject_propToLastUpdate = new WeakMap(), _LiveObject_instances = new WeakSet(), _LiveObject_applyUpdate = function _LiveObject_applyUpdate(op, isLocal) {
    let isModified = false;
    const reverse = [];
    const reverseUpdate = {
        type: OpType.UpdateObject,
        id: this._id,
        data: {},
    };
    reverse.push(reverseUpdate);
    for (const key in op.data) {
        const oldValue = __classPrivateFieldGet(this, _LiveObject_map, "f").get(key);
        if (oldValue instanceof AbstractCrdt) {
            reverse.push(...oldValue._serialize(this._id, key));
            oldValue._detach();
        }
        else if (oldValue !== undefined) {
            reverseUpdate.data[key] = oldValue;
        }
        else if (oldValue === undefined) {
            reverse.push({ type: OpType.DeleteObjectKey, id: this._id, key });
        }
    }
    for (const key in op.data) {
        if (isLocal) {
            __classPrivateFieldGet(this, _LiveObject_propToLastUpdate, "f").set(key, op.opId);
        }
        else if (__classPrivateFieldGet(this, _LiveObject_propToLastUpdate, "f").get(key) == null) {
            // Not modified localy so we apply update
            isModified = true;
        }
        else if (__classPrivateFieldGet(this, _LiveObject_propToLastUpdate, "f").get(key) === op.opId) {
            // Acknowlegment from local operation
            __classPrivateFieldGet(this, _LiveObject_propToLastUpdate, "f").delete(key);
            continue;
        }
        else {
            // Conflict, ignore remote operation
            continue;
        }
        const oldValue = __classPrivateFieldGet(this, _LiveObject_map, "f").get(key);
        if (isCrdt(oldValue)) {
            oldValue._detach();
        }
        isModified = true;
        __classPrivateFieldGet(this, _LiveObject_map, "f").set(key, op.data[key]);
    }
    if (Object.keys(reverseUpdate.data).length !== 0) {
        reverse.unshift(reverseUpdate);
    }
    return isModified ? { modified: this, reverse } : { modified: false };
}, _LiveObject_applyDeleteObjectKey = function _LiveObject_applyDeleteObjectKey(op) {
    const key = op.key;
    // If property does not exist, exit without notifying
    if (__classPrivateFieldGet(this, _LiveObject_map, "f").has(key) === false) {
        return { modified: false };
    }
    const oldValue = __classPrivateFieldGet(this, _LiveObject_map, "f").get(key);
    let reverse = [];
    if (isCrdt(oldValue)) {
        reverse = oldValue._serialize(this._id, op.key);
        oldValue._detach();
    }
    else if (oldValue !== undefined) {
        reverse = [
            {
                type: OpType.UpdateObject,
                id: this._id,
                data: { [key]: oldValue },
            },
        ];
    }
    __classPrivateFieldGet(this, _LiveObject_map, "f").delete(key);
    return { modified: this, reverse };
};
