import { AbstractCrdt, Doc, ApplyResult } from "./AbstractCrdt";
import { SerializedCrdtWithId, Op, SerializedCrdt } from "./live";
/**
 * INTERNAL
 */
export declare class LiveRegister<TValue = any> extends AbstractCrdt {
    #private;
    constructor(data: TValue);
    get data(): TValue;
    /**
     * INTERNAL
     */
    static _deserialize([id, item]: SerializedCrdtWithId, parentToChildren: Map<string, SerializedCrdtWithId[]>, doc: Doc): LiveRegister<any>;
    /**
     * INTERNAL
     */
    _serialize(parentId: string, parentKey: string, doc?: Doc): Op[];
    /**
     * INTERNAL
     */
    _toSerializedCrdt(): SerializedCrdt;
    _attachChild(id: string, key: string, crdt: AbstractCrdt, isLocal: boolean): ApplyResult;
    _detachChild(crdt: AbstractCrdt): void;
    _apply(op: Op, isLocal: boolean): ApplyResult;
}
