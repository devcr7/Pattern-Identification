"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _AbstractCrdt_parent, _AbstractCrdt_doc, _AbstractCrdt_id, _AbstractCrdt_parentKey;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractCrdt = void 0;
const live_1 = require("./live");
class AbstractCrdt {
    constructor() {
        _AbstractCrdt_parent.set(this, void 0);
        _AbstractCrdt_doc.set(this, void 0);
        _AbstractCrdt_id.set(this, void 0);
        _AbstractCrdt_parentKey.set(this, void 0);
    }
    /**
     * INTERNAL
     */
    get _doc() {
        return __classPrivateFieldGet(this, _AbstractCrdt_doc, "f");
    }
    /**
     * INTERNAL
     */
    get _id() {
        return __classPrivateFieldGet(this, _AbstractCrdt_id, "f");
    }
    /**
     * INTERNAL
     */
    get _parent() {
        return __classPrivateFieldGet(this, _AbstractCrdt_parent, "f");
    }
    /**
     * INTERNAL
     */
    get _parentKey() {
        return __classPrivateFieldGet(this, _AbstractCrdt_parentKey, "f");
    }
    /**
     * INTERNAL
     */
    _apply(op, isLocal) {
        switch (op.type) {
            case live_1.OpType.DeleteCrdt: {
                if (this._parent != null && this._parentKey != null) {
                    const parent = this._parent;
                    const reverse = this._serialize(this._parent._id, this._parentKey, __classPrivateFieldGet(this, _AbstractCrdt_doc, "f"));
                    this._parent._detachChild(this);
                    return { modified: parent, reverse };
                }
                return { modified: false };
            }
        }
        return { modified: false };
    }
    /**
     * INTERNAL
     */
    _setParentLink(parent, key) {
        if (__classPrivateFieldGet(this, _AbstractCrdt_parent, "f") != null && __classPrivateFieldGet(this, _AbstractCrdt_parent, "f") !== parent) {
            throw new Error("Cannot attach parent if it already exist");
        }
        __classPrivateFieldSet(this, _AbstractCrdt_parentKey, key, "f");
        __classPrivateFieldSet(this, _AbstractCrdt_parent, parent, "f");
    }
    /**
     * INTERNAL
     */
    _attach(id, doc) {
        if (__classPrivateFieldGet(this, _AbstractCrdt_id, "f") || __classPrivateFieldGet(this, _AbstractCrdt_doc, "f")) {
            throw new Error("Cannot attach if CRDT is already attached");
        }
        doc.addItem(id, this);
        __classPrivateFieldSet(this, _AbstractCrdt_id, id, "f");
        __classPrivateFieldSet(this, _AbstractCrdt_doc, doc, "f");
    }
    /**
     * INTERNAL
     */
    _detach() {
        if (__classPrivateFieldGet(this, _AbstractCrdt_doc, "f") && __classPrivateFieldGet(this, _AbstractCrdt_id, "f")) {
            __classPrivateFieldGet(this, _AbstractCrdt_doc, "f").deleteItem(__classPrivateFieldGet(this, _AbstractCrdt_id, "f"));
        }
        __classPrivateFieldSet(this, _AbstractCrdt_parent, undefined, "f");
        __classPrivateFieldSet(this, _AbstractCrdt_doc, undefined, "f");
    }
}
exports.AbstractCrdt = AbstractCrdt;
_AbstractCrdt_parent = new WeakMap(), _AbstractCrdt_doc = new WeakMap(), _AbstractCrdt_id = new WeakMap(), _AbstractCrdt_parentKey = new WeakMap();
