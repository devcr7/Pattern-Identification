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
var _LiveRegister_data;
import { AbstractCrdt } from "./AbstractCrdt";
import { CrdtType, OpType, } from "./live";
/**
 * INTERNAL
 */
export class LiveRegister extends AbstractCrdt {
    constructor(data) {
        super();
        _LiveRegister_data.set(this, void 0);
        __classPrivateFieldSet(this, _LiveRegister_data, data, "f");
    }
    get data() {
        return __classPrivateFieldGet(this, _LiveRegister_data, "f");
    }
    /**
     * INTERNAL
     */
    static _deserialize([id, item], parentToChildren, doc) {
        if (item.type !== CrdtType.Register) {
            throw new Error(`Tried to deserialize a map but item type is "${item.type}"`);
        }
        const register = new LiveRegister(item.data);
        register._attach(id, doc);
        return register;
    }
    /**
     * INTERNAL
     */
    _serialize(parentId, parentKey, doc) {
        if (this._id == null || parentId == null || parentKey == null) {
            throw new Error("Cannot serialize register if parentId or parentKey is undefined");
        }
        return [
            {
                type: OpType.CreateRegister,
                opId: doc === null || doc === void 0 ? void 0 : doc.generateOpId(),
                id: this._id,
                parentId,
                parentKey,
                data: this.data,
            },
        ];
    }
    /**
     * INTERNAL
     */
    _toSerializedCrdt() {
        var _a;
        return {
            type: CrdtType.Register,
            parentId: (_a = this._parent) === null || _a === void 0 ? void 0 : _a._id,
            parentKey: this._parentKey,
            data: this.data,
        };
    }
    _attachChild(id, key, crdt, isLocal) {
        throw new Error("Method not implemented.");
    }
    _detachChild(crdt) {
        throw new Error("Method not implemented.");
    }
    _apply(op, isLocal) {
        return super._apply(op, isLocal);
    }
}
_LiveRegister_data = new WeakMap();
