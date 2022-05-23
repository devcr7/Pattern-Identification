"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTreesDiffOperations = exports.selfOrRegister = exports.selfOrRegisterValue = exports.isCrdt = exports.deserialize = exports.isSameNodeOrChildOf = exports.remove = void 0;
const live_1 = require("./live");
const LiveList_1 = require("./LiveList");
const LiveMap_1 = require("./LiveMap");
const LiveObject_1 = require("./LiveObject");
const LiveRegister_1 = require("./LiveRegister");
function remove(array, item) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === item) {
            array.splice(i, 1);
            break;
        }
    }
}
exports.remove = remove;
function isSameNodeOrChildOf(node, parent) {
    if (node === parent) {
        return true;
    }
    if (node._parent) {
        return isSameNodeOrChildOf(node._parent, parent);
    }
    return false;
}
exports.isSameNodeOrChildOf = isSameNodeOrChildOf;
function deserialize(entry, parentToChildren, doc) {
    switch (entry[1].type) {
        case live_1.CrdtType.Object: {
            return LiveObject_1.LiveObject._deserialize(entry, parentToChildren, doc);
        }
        case live_1.CrdtType.List: {
            return LiveList_1.LiveList._deserialize(entry, parentToChildren, doc);
        }
        case live_1.CrdtType.Map: {
            return LiveMap_1.LiveMap._deserialize(entry, parentToChildren, doc);
        }
        case live_1.CrdtType.Register: {
            return LiveRegister_1.LiveRegister._deserialize(entry, parentToChildren, doc);
        }
        default: {
            throw new Error("Unexpected CRDT type");
        }
    }
}
exports.deserialize = deserialize;
function isCrdt(obj) {
    return (obj instanceof LiveObject_1.LiveObject ||
        obj instanceof LiveMap_1.LiveMap ||
        obj instanceof LiveList_1.LiveList ||
        obj instanceof LiveRegister_1.LiveRegister);
}
exports.isCrdt = isCrdt;
function selfOrRegisterValue(obj) {
    if (obj instanceof LiveRegister_1.LiveRegister) {
        return obj.data;
    }
    return obj;
}
exports.selfOrRegisterValue = selfOrRegisterValue;
function selfOrRegister(obj) {
    if (obj instanceof LiveObject_1.LiveObject ||
        obj instanceof LiveMap_1.LiveMap ||
        obj instanceof LiveList_1.LiveList) {
        return obj;
    }
    else if (obj instanceof LiveRegister_1.LiveRegister) {
        throw new Error("Internal error. LiveRegister should not be created from selfOrRegister");
    }
    else {
        return new LiveRegister_1.LiveRegister(obj);
    }
}
exports.selfOrRegister = selfOrRegister;
function getTreesDiffOperations(currentItems, newItems) {
    const ops = [];
    currentItems.forEach((_, id) => {
        if (!newItems.get(id)) {
            // Delete crdt
            ops.push({
                type: live_1.OpType.DeleteCrdt,
                id: id,
            });
        }
    });
    newItems.forEach((crdt, id) => {
        const currentCrdt = currentItems.get(id);
        if (currentCrdt) {
            if (crdt.type === live_1.CrdtType.Object) {
                if (JSON.stringify(crdt.data) !==
                    JSON.stringify(currentCrdt.data)) {
                    ops.push({
                        type: live_1.OpType.UpdateObject,
                        id: id,
                        data: crdt.data,
                    });
                }
            }
            if (crdt.parentKey !== currentCrdt.parentKey) {
                ops.push({
                    type: live_1.OpType.SetParentKey,
                    id: id,
                    parentKey: crdt.parentKey,
                });
            }
        }
        else {
            // new Crdt
            switch (crdt.type) {
                case live_1.CrdtType.Register:
                    ops.push({
                        type: live_1.OpType.CreateRegister,
                        id: id,
                        parentId: crdt.parentId,
                        parentKey: crdt.parentKey,
                        data: crdt.data,
                    });
                    break;
                case live_1.CrdtType.List:
                    ops.push({
                        type: live_1.OpType.CreateList,
                        id: id,
                        parentId: crdt.parentId,
                        parentKey: crdt.parentKey,
                    });
                    break;
                case live_1.CrdtType.Object:
                    ops.push({
                        type: live_1.OpType.CreateObject,
                        id: id,
                        parentId: crdt.parentId,
                        parentKey: crdt.parentKey,
                        data: crdt.data,
                    });
                    break;
                case live_1.CrdtType.Map:
                    ops.push({
                        type: live_1.OpType.CreateMap,
                        id: id,
                        parentId: crdt.parentId,
                        parentKey: crdt.parentKey,
                    });
                    break;
            }
        }
    });
    return ops;
}
exports.getTreesDiffOperations = getTreesDiffOperations;
