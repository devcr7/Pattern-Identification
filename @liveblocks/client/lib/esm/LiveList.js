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
var _LiveList_items, _LiveListIterator_innerIterator;
import { AbstractCrdt } from "./AbstractCrdt";
import { deserialize, selfOrRegister, selfOrRegisterValue } from "./utils";
import { OpType, CrdtType, } from "./live";
import { makePosition, compare } from "./position";
/**
 * The LiveList class represents an ordered collection of items that is synchorinized across clients.
 */
export class LiveList extends AbstractCrdt {
    constructor(items = []) {
        super();
        // TODO: Naive array at first, find a better data structure. Maybe an Order statistics tree?
        _LiveList_items.set(this, []);
        let position = undefined;
        for (let i = 0; i < items.length; i++) {
            const newPosition = makePosition(position);
            const item = selfOrRegister(items[i]);
            __classPrivateFieldGet(this, _LiveList_items, "f").push([item, newPosition]);
            position = newPosition;
        }
    }
    /**
     * INTERNAL
     */
    static _deserialize([id, item], parentToChildren, doc) {
        const list = new LiveList([]);
        list._attach(id, doc);
        const children = parentToChildren.get(id);
        if (children == null) {
            return list;
        }
        for (const entry of children) {
            const child = deserialize(entry, parentToChildren, doc);
            child._setParentLink(list, entry[1].parentKey);
            __classPrivateFieldGet(list, _LiveList_items, "f").push([child, entry[1].parentKey]);
            __classPrivateFieldGet(list, _LiveList_items, "f").sort((itemA, itemB) => compare(itemA[1], itemB[1]));
        }
        return list;
    }
    /**
     * INTERNAL
     */
    _serialize(parentId, parentKey, doc) {
        if (this._id == null) {
            throw new Error("Cannot serialize item is not attached");
        }
        if (parentId == null || parentKey == null) {
            throw new Error("Cannot serialize list if parentId or parentKey is undefined");
        }
        const ops = [];
        const op = {
            id: this._id,
            opId: doc === null || doc === void 0 ? void 0 : doc.generateOpId(),
            type: OpType.CreateList,
            parentId,
            parentKey,
        };
        ops.push(op);
        for (const [value, key] of __classPrivateFieldGet(this, _LiveList_items, "f")) {
            ops.push(...value._serialize(this._id, key, doc));
        }
        return ops;
    }
    /**
     * INTERNAL
     */
    _attach(id, doc) {
        super._attach(id, doc);
        for (const [item, position] of __classPrivateFieldGet(this, _LiveList_items, "f")) {
            item._attach(doc.generateId(), doc);
        }
    }
    /**
     * INTERNAL
     */
    _detach() {
        super._detach();
        for (const [value] of __classPrivateFieldGet(this, _LiveList_items, "f")) {
            value._detach();
        }
    }
    /**
     * INTERNAL
     */
    _attachChild(id, key, child, isLocal) {
        var _a;
        if (this._doc == null) {
            throw new Error("Can't attach child if doc is not present");
        }
        child._attach(id, this._doc);
        child._setParentLink(this, key);
        const index = __classPrivateFieldGet(this, _LiveList_items, "f").findIndex((entry) => entry[1] === key);
        let newKey = key;
        // If there is a conflict
        if (index !== -1) {
            if (isLocal) {
                // If change is local => assign a temporary position to newly attached child
                let before = __classPrivateFieldGet(this, _LiveList_items, "f")[index] ? __classPrivateFieldGet(this, _LiveList_items, "f")[index][1] : undefined;
                let after = __classPrivateFieldGet(this, _LiveList_items, "f")[index + 1]
                    ? __classPrivateFieldGet(this, _LiveList_items, "f")[index + 1][1]
                    : undefined;
                newKey = makePosition(before, after);
                child._setParentLink(this, newKey);
            }
            else {
                // If change is remote => assign a temporary position to existing child until we get the fix from the backend
                __classPrivateFieldGet(this, _LiveList_items, "f")[index][1] = makePosition(key, (_a = __classPrivateFieldGet(this, _LiveList_items, "f")[index + 1]) === null || _a === void 0 ? void 0 : _a[1]);
            }
        }
        __classPrivateFieldGet(this, _LiveList_items, "f").push([child, newKey]);
        __classPrivateFieldGet(this, _LiveList_items, "f").sort((itemA, itemB) => compare(itemA[1], itemB[1]));
        return { reverse: [{ type: OpType.DeleteCrdt, id }], modified: this };
    }
    /**
     * INTERNAL
     */
    _detachChild(child) {
        const indexToDelete = __classPrivateFieldGet(this, _LiveList_items, "f").findIndex((item) => item[0] === child);
        __classPrivateFieldGet(this, _LiveList_items, "f").splice(indexToDelete, 1);
        if (child) {
            child._detach();
        }
    }
    /**
     * INTERNAL
     */
    _setChildKey(key, child) {
        var _a;
        child._setParentLink(this, key);
        const index = __classPrivateFieldGet(this, _LiveList_items, "f").findIndex((entry) => entry[1] === key);
        // Assign a temporary position until we get the fix from the backend
        if (index !== -1) {
            __classPrivateFieldGet(this, _LiveList_items, "f")[index][1] = makePosition(key, (_a = __classPrivateFieldGet(this, _LiveList_items, "f")[index + 1]) === null || _a === void 0 ? void 0 : _a[1]);
        }
        const item = __classPrivateFieldGet(this, _LiveList_items, "f").find((item) => item[0] === child);
        if (item) {
            item[1] = key;
        }
        __classPrivateFieldGet(this, _LiveList_items, "f").sort((itemA, itemB) => compare(itemA[1], itemB[1]));
    }
    /**
     * INTERNAL
     */
    _apply(op, isLocal) {
        return super._apply(op, isLocal);
    }
    /**
     * INTERNAL
     */
    _toSerializedCrdt() {
        var _a;
        return {
            type: CrdtType.List,
            parentId: (_a = this._parent) === null || _a === void 0 ? void 0 : _a._id,
            parentKey: this._parentKey,
        };
    }
    /**
     * Returns the number of elements.
     */
    get length() {
        return __classPrivateFieldGet(this, _LiveList_items, "f").length;
    }
    /**
     * Adds one element to the end of the LiveList.
     * @param element The element to add to the end of the LiveList.
     */
    push(element) {
        return this.insert(element, this.length);
    }
    /**
     * Inserts one element at a specified index.
     * @param element The element to insert.
     * @param index The index at which you want to insert the element.
     */
    insert(element, index) {
        if (index < 0 || index > __classPrivateFieldGet(this, _LiveList_items, "f").length) {
            throw new Error(`Cannot delete list item at index "${index}". index should be between 0 and ${__classPrivateFieldGet(this, _LiveList_items, "f").length}`);
        }
        let before = __classPrivateFieldGet(this, _LiveList_items, "f")[index - 1] ? __classPrivateFieldGet(this, _LiveList_items, "f")[index - 1][1] : undefined;
        let after = __classPrivateFieldGet(this, _LiveList_items, "f")[index] ? __classPrivateFieldGet(this, _LiveList_items, "f")[index][1] : undefined;
        const position = makePosition(before, after);
        const value = selfOrRegister(element);
        value._setParentLink(this, position);
        __classPrivateFieldGet(this, _LiveList_items, "f").push([value, position]);
        __classPrivateFieldGet(this, _LiveList_items, "f").sort((itemA, itemB) => compare(itemA[1], itemB[1]));
        if (this._doc && this._id) {
            const id = this._doc.generateId();
            value._attach(id, this._doc);
            this._doc.dispatch(value._serialize(this._id, position, this._doc), [{ type: OpType.DeleteCrdt, id }], [this]);
        }
    }
    /**
     * Move one element from one index to another.
     * @param index The index of the element to move
     * @param targetIndex The index where the element should be after moving.
     */
    move(index, targetIndex) {
        if (targetIndex < 0) {
            throw new Error("targetIndex cannot be less than 0");
        }
        if (targetIndex >= __classPrivateFieldGet(this, _LiveList_items, "f").length) {
            throw new Error("targetIndex cannot be greater or equal than the list length");
        }
        if (index < 0) {
            throw new Error("index cannot be less than 0");
        }
        if (index >= __classPrivateFieldGet(this, _LiveList_items, "f").length) {
            throw new Error("index cannot be greater or equal than the list length");
        }
        let beforePosition = null;
        let afterPosition = null;
        if (index < targetIndex) {
            afterPosition =
                targetIndex === __classPrivateFieldGet(this, _LiveList_items, "f").length - 1
                    ? undefined
                    : __classPrivateFieldGet(this, _LiveList_items, "f")[targetIndex + 1][1];
            beforePosition = __classPrivateFieldGet(this, _LiveList_items, "f")[targetIndex][1];
        }
        else {
            afterPosition = __classPrivateFieldGet(this, _LiveList_items, "f")[targetIndex][1];
            beforePosition =
                targetIndex === 0 ? undefined : __classPrivateFieldGet(this, _LiveList_items, "f")[targetIndex - 1][1];
        }
        const position = makePosition(beforePosition, afterPosition);
        const item = __classPrivateFieldGet(this, _LiveList_items, "f")[index];
        const previousPosition = item[1];
        item[1] = position;
        item[0]._setParentLink(this, position);
        __classPrivateFieldGet(this, _LiveList_items, "f").sort((itemA, itemB) => compare(itemA[1], itemB[1]));
        if (this._doc && this._id) {
            this._doc.dispatch([
                {
                    type: OpType.SetParentKey,
                    id: item[0]._id,
                    opId: this._doc.generateOpId(),
                    parentKey: position,
                },
            ], [
                {
                    type: OpType.SetParentKey,
                    id: item[0]._id,
                    parentKey: previousPosition,
                },
            ], [this]);
        }
    }
    /**
     * Deletes an element at the specified index
     * @param index The index of the element to delete
     */
    delete(index) {
        if (index < 0 || index >= __classPrivateFieldGet(this, _LiveList_items, "f").length) {
            throw new Error(`Cannot delete list item at index "${index}". index should be between 0 and ${__classPrivateFieldGet(this, _LiveList_items, "f").length - 1}`);
        }
        const item = __classPrivateFieldGet(this, _LiveList_items, "f")[index];
        item[0]._detach();
        __classPrivateFieldGet(this, _LiveList_items, "f").splice(index, 1);
        if (this._doc) {
            const childRecordId = item[0]._id;
            if (childRecordId) {
                this._doc.dispatch([
                    {
                        id: childRecordId,
                        opId: this._doc.generateOpId(),
                        type: OpType.DeleteCrdt,
                    },
                ], item[0]._serialize(this._id, item[1]), [this]);
            }
        }
    }
    clear() {
        if (this._doc) {
            let ops = [];
            let reverseOps = [];
            for (const item of __classPrivateFieldGet(this, _LiveList_items, "f")) {
                item[0]._detach();
                const childId = item[0]._id;
                if (childId) {
                    ops.push({ id: childId, type: OpType.DeleteCrdt });
                    reverseOps.push(...item[0]._serialize(this._id, item[1]));
                }
            }
            __classPrivateFieldSet(this, _LiveList_items, [], "f");
            this._doc.dispatch(ops, reverseOps, [this]);
        }
        else {
            for (const item of __classPrivateFieldGet(this, _LiveList_items, "f")) {
                item[0]._detach();
            }
            __classPrivateFieldSet(this, _LiveList_items, [], "f");
        }
    }
    /**
     * Returns an Array of all the elements in the LiveList.
     */
    toArray() {
        return __classPrivateFieldGet(this, _LiveList_items, "f").map((entry) => selfOrRegisterValue(entry[0]));
    }
    /**
     * Tests whether all elements pass the test implemented by the provided function.
     * @param predicate Function to test for each element, taking two arguments (the element and its index).
     * @returns true if the predicate function returns a truthy value for every element. Otherwise, false.
     */
    every(predicate) {
        return this.toArray().every(predicate);
    }
    /**
     * Creates an array with all elements that pass the test implemented by the provided function.
     * @param predicate Function to test each element of the LiveList. Return a value that coerces to true to keep the element, or to false otherwise.
     * @returns An array with the elements that pass the test.
     */
    filter(predicate) {
        return this.toArray().filter(predicate);
    }
    /**
     * Returns the first element that satisfies the provided testing function.
     * @param predicate Function to execute on each value.
     * @returns The value of the first element in the LiveList that satisfies the provided testing function. Otherwise, undefined is returned.
     */
    find(predicate) {
        return this.toArray().find(predicate);
    }
    /**
     * Returns the index of the first element in the LiveList that satisfies the provided testing function.
     * @param predicate Function to execute on each value until the function returns true, indicating that the satisfying element was found.
     * @returns The index of the first element in the LiveList that passes the test. Otherwise, -1.
     */
    findIndex(predicate) {
        return this.toArray().findIndex(predicate);
    }
    /**
     * Executes a provided function once for each element.
     * @param callbackfn Function to execute on each element.
     */
    forEach(callbackfn) {
        return this.toArray().forEach(callbackfn);
    }
    /**
     * Get the element at the specified index.
     * @param index The index on the element to get.
     * @returns The element at the specified index or undefined.
     */
    get(index) {
        if (index < 0 || index >= __classPrivateFieldGet(this, _LiveList_items, "f").length) {
            return undefined;
        }
        return selfOrRegisterValue(__classPrivateFieldGet(this, _LiveList_items, "f")[index][0]);
    }
    /**
     * Returns the first index at which a given element can be found in the LiveList, or -1 if it is not present.
     * @param searchElement Element to locate.
     * @param fromIndex The index to start the search at.
     * @returns The first index of the element in the LiveList; -1 if not found.
     */
    indexOf(searchElement, fromIndex) {
        return this.toArray().indexOf(searchElement, fromIndex);
    }
    /**
     * Returns the last index at which a given element can be found in the LiveList, or -1 if it is not present. The LiveLsit is searched backwards, starting at fromIndex.
     * @param searchElement Element to locate.
     * @param fromIndex The index at which to start searching backwards.
     * @returns
     */
    lastIndexOf(searchElement, fromIndex) {
        return this.toArray().lastIndexOf(searchElement, fromIndex);
    }
    /**
     * Creates an array populated with the results of calling a provided function on every element.
     * @param callback Function that is called for every element.
     * @returns An array with each element being the result of the callback function.
     */
    map(callback) {
        return __classPrivateFieldGet(this, _LiveList_items, "f").map((entry, i) => callback(selfOrRegisterValue(entry[0]), i));
    }
    /**
     * Tests whether at least one element in the LiveList passes the test implemented by the provided function.
     * @param predicate Function to test for each element.
     * @returns true if the callback function returns a truthy value for at least one element. Otherwise, false.
     */
    some(predicate) {
        return this.toArray().some(predicate);
    }
    [(_LiveList_items = new WeakMap(), Symbol.iterator)]() {
        return new LiveListIterator(__classPrivateFieldGet(this, _LiveList_items, "f"));
    }
}
class LiveListIterator {
    constructor(items) {
        _LiveListIterator_innerIterator.set(this, void 0);
        __classPrivateFieldSet(this, _LiveListIterator_innerIterator, items[Symbol.iterator](), "f");
    }
    [(_LiveListIterator_innerIterator = new WeakMap(), Symbol.iterator)]() {
        return this;
    }
    next() {
        const result = __classPrivateFieldGet(this, _LiveListIterator_innerIterator, "f").next();
        if (result.done) {
            return {
                done: true,
                value: undefined,
            };
        }
        return {
            value: selfOrRegisterValue(result.value[0]),
        };
    }
}
