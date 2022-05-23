import { AbstractCrdt, Doc, ApplyResult } from "./AbstractCrdt";
import { Op, SerializedCrdtWithId, SerializedCrdt } from "./live";
/**
 * The LiveMap class is similar to a JavaScript Map that is synchronized on all clients.
 * Keys should be a string, and values should be serializable to JSON.
 * If multiple clients update the same property simultaneously, the last modification received by the Liveblocks servers is the winner.
 */
export declare class LiveMap<TKey extends string, TValue> extends AbstractCrdt {
    #private;
    constructor(entries?: readonly (readonly [TKey, TValue])[] | null | undefined);
    /**
     * INTERNAL
     */
    _serialize(parentId?: string, parentKey?: string, doc?: Doc): Op[];
    /**
     * INTERNAL
     */
    static _deserialize([id, item]: SerializedCrdtWithId, parentToChildren: Map<string, SerializedCrdtWithId[]>, doc: Doc): LiveMap<string, unknown>;
    /**
     * INTERNAL
     */
    _attach(id: string, doc: Doc): void;
    /**
     * INTERNAL
     */
    _attachChild(id: string, key: TKey, child: AbstractCrdt, isLocal: boolean): ApplyResult;
    /**
     * INTERNAL
     */
    _detach(): void;
    /**
     * INTERNAL
     */
    _detachChild(child: AbstractCrdt): void;
    /**
     * INTERNAL
     */
    _toSerializedCrdt(): SerializedCrdt;
    /**
     * Returns a specified element from the LiveMap.
     * @param key The key of the element to return.
     * @returns The element associated with the specified key, or undefined if the key can't be found in the LiveMap.
     */
    get(key: TKey): TValue | undefined;
    /**
     * Adds or updates an element with a specified key and a value.
     * @param key The key of the element to add. Should be a string.
     * @param value The value of the element to add. Should be serializable to JSON.
     */
    set(key: TKey, value: TValue): void;
    /**
     * Returns the number of elements in the LiveMap.
     */
    get size(): number;
    /**
     * Returns a boolean indicating whether an element with the specified key exists or not.
     * @param key The key of the element to test for presence.
     */
    has(key: TKey): boolean;
    /**
     * Removes the specified element by key.
     * @param key The key of the element to remove.
     * @returns true if an element existed and has been removed, or false if the element does not exist.
     */
    delete(key: TKey): boolean;
    /**
     * Returns a new Iterator object that contains the [key, value] pairs for each element.
     */
    entries(): IterableIterator<[string, TValue]>;
    /**
     * Same function object as the initial value of the entries method.
     */
    [Symbol.iterator](): IterableIterator<[string, TValue]>;
    /**
     * Returns a new Iterator object that contains the keys for each element.
     */
    keys(): IterableIterator<TKey>;
    /**
     * Returns a new Iterator object that contains the values for each element.
     */
    values(): IterableIterator<TValue>;
    /**
     * Executes a provided function once per each key/value pair in the Map object, in insertion order.
     * @param callback Function to execute for each entry in the map.
     */
    forEach(callback: (value: TValue, key: TKey, map: LiveMap<TKey, TValue>) => void): void;
}
