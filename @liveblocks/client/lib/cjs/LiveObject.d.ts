import { AbstractCrdt, Doc, ApplyResult } from "./AbstractCrdt";
import { Op, SerializedCrdt, SerializedCrdtWithId } from "./live";
/**
 * The LiveObject class is similar to a JavaScript object that is synchronized on all clients.
 * Keys should be a string, and values should be serializable to JSON.
 * If multiple clients update the same property simultaneously, the last modification received by the Liveblocks servers is the winner.
 */
export declare class LiveObject<T extends Record<string, any> = Record<string, any>> extends AbstractCrdt {
    #private;
    constructor(object?: T);
    /**
     * INTERNAL
     */
    _serialize(parentId?: string, parentKey?: string, doc?: Doc): Op[];
    /**
     * INTERNAL
     */
    static _deserialize([id, item]: SerializedCrdtWithId, parentToChildren: Map<string, SerializedCrdtWithId[]>, doc: Doc): LiveObject<Record<string, any>>;
    /**
     * INTERNAL
     */
    static _deserializeChildren(object: LiveObject, parentToChildren: Map<string, SerializedCrdtWithId[]>, doc: Doc): LiveObject<Record<string, any>>;
    /**
     * INTERNAL
     */
    _attach(id: string, doc: Doc): void;
    /**
     * INTERNAL
     */
    _attachChild(id: string, key: keyof T, child: AbstractCrdt, isLocal: boolean): ApplyResult;
    /**
     * INTERNAL
     */
    _detachChild(child: AbstractCrdt): void;
    /**
     * INTERNAL
     */
    _detachChildren(): void;
    /**
     * INTERNAL
     */
    _detach(): void;
    /**
     * INTERNAL
     */
    _apply(op: Op, isLocal: boolean): ApplyResult;
    /**
     * INTERNAL
     */
    _toSerializedCrdt(): SerializedCrdt;
    /**
     * Transform the LiveObject into a javascript object
     */
    toObject(): T;
    /**
     * Adds or updates a property with a specified key and a value.
     * @param key The key of the property to add
     * @param value The value of the property to add
     */
    set<TKey extends keyof T>(key: TKey, value: T[TKey]): void;
    /**
     * Returns a specified property from the LiveObject.
     * @param key The key of the property to get
     */
    get<TKey extends keyof T>(key: TKey): T[TKey];
    /**
     * Deletes a key from the LiveObject
     * @param key The key of the property to delete
     */
    delete(key: keyof T): void;
    /**
     * Adds or updates multiple properties at once with an object.
     * @param overrides The object used to overrides properties
     */
    update(overrides: Partial<T>): void;
}
