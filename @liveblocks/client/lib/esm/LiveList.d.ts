import { AbstractCrdt, Doc, ApplyResult } from "./AbstractCrdt";
import { SerializedList, SerializedCrdtWithId, Op, SerializedCrdt } from "./live";
/**
 * The LiveList class represents an ordered collection of items that is synchorinized across clients.
 */
export declare class LiveList<T> extends AbstractCrdt {
    #private;
    constructor(items?: T[]);
    /**
     * INTERNAL
     */
    static _deserialize([id, item]: [id: string, item: SerializedList], parentToChildren: Map<string, SerializedCrdtWithId[]>, doc: Doc): LiveList<never>;
    /**
     * INTERNAL
     */
    _serialize(parentId?: string, parentKey?: string, doc?: Doc): Op[];
    /**
     * INTERNAL
     */
    _attach(id: string, doc: Doc): void;
    /**
     * INTERNAL
     */
    _detach(): void;
    /**
     * INTERNAL
     */
    _attachChild(id: string, key: string, child: AbstractCrdt, isLocal: boolean): ApplyResult;
    /**
     * INTERNAL
     */
    _detachChild(child: AbstractCrdt): void;
    /**
     * INTERNAL
     */
    _setChildKey(key: string, child: AbstractCrdt): void;
    /**
     * INTERNAL
     */
    _apply(op: Op, isLocal: boolean): ApplyResult;
    /**
     * INTERNAL
     */
    _toSerializedCrdt(): SerializedCrdt;
    /**
     * Returns the number of elements.
     */
    get length(): number;
    /**
     * Adds one element to the end of the LiveList.
     * @param element The element to add to the end of the LiveList.
     */
    push(element: T): void;
    /**
     * Inserts one element at a specified index.
     * @param element The element to insert.
     * @param index The index at which you want to insert the element.
     */
    insert(element: T, index: number): void;
    /**
     * Move one element from one index to another.
     * @param index The index of the element to move
     * @param targetIndex The index where the element should be after moving.
     */
    move(index: number, targetIndex: number): void;
    /**
     * Deletes an element at the specified index
     * @param index The index of the element to delete
     */
    delete(index: number): void;
    clear(): void;
    /**
     * Returns an Array of all the elements in the LiveList.
     */
    toArray(): T[];
    /**
     * Tests whether all elements pass the test implemented by the provided function.
     * @param predicate Function to test for each element, taking two arguments (the element and its index).
     * @returns true if the predicate function returns a truthy value for every element. Otherwise, false.
     */
    every(predicate: (value: T, index: number) => unknown): boolean;
    /**
     * Creates an array with all elements that pass the test implemented by the provided function.
     * @param predicate Function to test each element of the LiveList. Return a value that coerces to true to keep the element, or to false otherwise.
     * @returns An array with the elements that pass the test.
     */
    filter(predicate: (value: T, index: number) => unknown): T[];
    /**
     * Returns the first element that satisfies the provided testing function.
     * @param predicate Function to execute on each value.
     * @returns The value of the first element in the LiveList that satisfies the provided testing function. Otherwise, undefined is returned.
     */
    find(predicate: (value: T, index: number) => unknown): T | undefined;
    /**
     * Returns the index of the first element in the LiveList that satisfies the provided testing function.
     * @param predicate Function to execute on each value until the function returns true, indicating that the satisfying element was found.
     * @returns The index of the first element in the LiveList that passes the test. Otherwise, -1.
     */
    findIndex(predicate: (value: T, index: number) => unknown): number;
    /**
     * Executes a provided function once for each element.
     * @param callbackfn Function to execute on each element.
     */
    forEach(callbackfn: (value: T, index: number) => void): void;
    /**
     * Get the element at the specified index.
     * @param index The index on the element to get.
     * @returns The element at the specified index or undefined.
     */
    get(index: number): T | undefined;
    /**
     * Returns the first index at which a given element can be found in the LiveList, or -1 if it is not present.
     * @param searchElement Element to locate.
     * @param fromIndex The index to start the search at.
     * @returns The first index of the element in the LiveList; -1 if not found.
     */
    indexOf(searchElement: T, fromIndex?: number): number;
    /**
     * Returns the last index at which a given element can be found in the LiveList, or -1 if it is not present. The LiveLsit is searched backwards, starting at fromIndex.
     * @param searchElement Element to locate.
     * @param fromIndex The index at which to start searching backwards.
     * @returns
     */
    lastIndexOf(searchElement: T, fromIndex?: number): number;
    /**
     * Creates an array populated with the results of calling a provided function on every element.
     * @param callback Function that is called for every element.
     * @returns An array with each element being the result of the callback function.
     */
    map<U>(callback: (value: T, index: number) => U): U[];
    /**
     * Tests whether at least one element in the LiveList passes the test implemented by the provided function.
     * @param predicate Function to test for each element.
     * @returns true if the callback function returns a truthy value for at least one element. Otherwise, false.
     */
    some(predicate: (value: T, index: number) => unknown): boolean;
    [Symbol.iterator](): IterableIterator<T>;
}
