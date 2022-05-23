import { Op, SerializedCrdt } from "./live";
export declare type ApplyResult = {
    reverse: Op[];
    modified: AbstractCrdt;
} | {
    modified: false;
};
export interface Doc {
    generateId: () => string;
    generateOpId: () => string;
    addItem: (id: string, item: AbstractCrdt) => void;
    deleteItem: (id: string) => void;
    dispatch: (ops: Op[], reverseOps: Op[], modified: AbstractCrdt[]) => void;
}
export declare abstract class AbstractCrdt {
    #private;
    /**
     * INTERNAL
     */
    protected get _doc(): Doc | undefined;
    /**
     * INTERNAL
     */
    get _id(): string | undefined;
    /**
     * INTERNAL
     */
    get _parent(): AbstractCrdt | undefined;
    /**
     * INTERNAL
     */
    get _parentKey(): string | undefined;
    /**
     * INTERNAL
     */
    _apply(op: Op, isLocal: boolean): ApplyResult;
    /**
     * INTERNAL
     */
    _setParentLink(parent: AbstractCrdt, key: string): void;
    /**
     * INTERNAL
     */
    _attach(id: string, doc: Doc): void;
    /**
     * INTERNAL
     */
    abstract _attachChild(id: string, key: string, crdt: AbstractCrdt, isLocal: boolean): ApplyResult;
    /**
     * INTERNAL
     */
    _detach(): void;
    /**
     * INTERNAL
     */
    abstract _detachChild(crdt: AbstractCrdt): void;
    /**
     * INTERNAL
     */
    abstract _serialize(parentId: string, parentKey: string, doc?: Doc): Op[];
    /**
     * INTERNAL
     */
    abstract _toSerializedCrdt(): SerializedCrdt;
}
