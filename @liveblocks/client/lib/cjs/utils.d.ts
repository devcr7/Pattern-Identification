import { AbstractCrdt, Doc } from "./AbstractCrdt";
import { SerializedCrdtWithId, Op, SerializedCrdt } from "./live";
export declare function remove<T>(array: T[], item: T): void;
export declare function isSameNodeOrChildOf(node: AbstractCrdt, parent: AbstractCrdt): boolean;
export declare function deserialize(entry: SerializedCrdtWithId, parentToChildren: Map<string, SerializedCrdtWithId[]>, doc: Doc): AbstractCrdt;
export declare function isCrdt(obj: any): obj is AbstractCrdt;
export declare function selfOrRegisterValue(obj: AbstractCrdt): any;
export declare function selfOrRegister(obj: any): AbstractCrdt;
export declare function getTreesDiffOperations(currentItems: Map<string, SerializedCrdt>, newItems: Map<string, SerializedCrdt>): Op[];
