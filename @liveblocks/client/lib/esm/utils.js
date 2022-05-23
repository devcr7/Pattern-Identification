import { CrdtType, OpType, } from "./live";
import { LiveList } from "./LiveList";
import { LiveMap } from "./LiveMap";
import { LiveObject } from "./LiveObject";
import { LiveRegister } from "./LiveRegister";
export function remove(array, item) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === item) {
            array.splice(i, 1);
            break;
        }
    }
}
export function isSameNodeOrChildOf(node, parent) {
    if (node === parent) {
        return true;
    }
    if (node._parent) {
        return isSameNodeOrChildOf(node._parent, parent);
    }
    return false;
}
export function deserialize(entry, parentToChildren, doc) {
    switch (entry[1].type) {
        case CrdtType.Object: {
            return LiveObject._deserialize(entry, parentToChildren, doc);
        }
        case CrdtType.List: {
            return LiveList._deserialize(entry, parentToChildren, doc);
        }
        case CrdtType.Map: {
            return LiveMap._deserialize(entry, parentToChildren, doc);
        }
        case CrdtType.Register: {
            return LiveRegister._deserialize(entry, parentToChildren, doc);
        }
        default: {
            throw new Error("Unexpected CRDT type");
        }
    }
}
export function isCrdt(obj) {
    return (obj instanceof LiveObject ||
        obj instanceof LiveMap ||
        obj instanceof LiveList ||
        obj instanceof LiveRegister);
}
export function selfOrRegisterValue(obj) {
    if (obj instanceof LiveRegister) {
        return obj.data;
    }
    return obj;
}
export function selfOrRegister(obj) {
    if (obj instanceof LiveObject ||
        obj instanceof LiveMap ||
        obj instanceof LiveList) {
        return obj;
    }
    else if (obj instanceof LiveRegister) {
        throw new Error("Internal error. LiveRegister should not be created from selfOrRegister");
    }
    else {
        return new LiveRegister(obj);
    }
}
export function getTreesDiffOperations(currentItems, newItems) {
    const ops = [];
    currentItems.forEach((_, id) => {
        if (!newItems.get(id)) {
            // Delete crdt
            ops.push({
                type: OpType.DeleteCrdt,
                id: id,
            });
        }
    });
    newItems.forEach((crdt, id) => {
        const currentCrdt = currentItems.get(id);
        if (currentCrdt) {
            if (crdt.type === CrdtType.Object) {
                if (JSON.stringify(crdt.data) !==
                    JSON.stringify(currentCrdt.data)) {
                    ops.push({
                        type: OpType.UpdateObject,
                        id: id,
                        data: crdt.data,
                    });
                }
            }
            if (crdt.parentKey !== currentCrdt.parentKey) {
                ops.push({
                    type: OpType.SetParentKey,
                    id: id,
                    parentKey: crdt.parentKey,
                });
            }
        }
        else {
            // new Crdt
            switch (crdt.type) {
                case CrdtType.Register:
                    ops.push({
                        type: OpType.CreateRegister,
                        id: id,
                        parentId: crdt.parentId,
                        parentKey: crdt.parentKey,
                        data: crdt.data,
                    });
                    break;
                case CrdtType.List:
                    ops.push({
                        type: OpType.CreateList,
                        id: id,
                        parentId: crdt.parentId,
                        parentKey: crdt.parentKey,
                    });
                    break;
                case CrdtType.Object:
                    ops.push({
                        type: OpType.CreateObject,
                        id: id,
                        parentId: crdt.parentId,
                        parentKey: crdt.parentKey,
                        data: crdt.data,
                    });
                    break;
                case CrdtType.Map:
                    ops.push({
                        type: OpType.CreateMap,
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
