import { Presence } from "./types";
export declare type ServerMessage = UpdatePresenceMessage | UserJoinMessage | UserLeftMessage | EventMessage | RoomStateMessage | InitialDocumentStateMessage | UpdateStorageMessage;
export declare enum ServerMessageType {
    UpdatePresence = 100,
    UserJoined = 101,
    UserLeft = 102,
    Event = 103,
    RoomState = 104,
    InitialStorageState = 200,
    UpdateStorage = 201
}
export declare type RoomStateMessage = {
    type: ServerMessageType.RoomState;
    users: {
        [actor: number]: {
            id?: string;
            info?: any;
        };
    };
};
export declare type UpdatePresenceMessage = {
    type: ServerMessageType.UpdatePresence;
    actor: number;
    data: Presence;
};
export declare type UserJoinMessage = {
    type: ServerMessageType.UserJoined;
    actor: number;
    id?: string;
    info?: string;
};
export declare type UserLeftMessage = {
    type: ServerMessageType.UserLeft;
    actor: number;
};
export declare type EventMessage = {
    type: ServerMessageType.Event;
    actor: number;
    event: any;
};
export declare type SerializedCrdtWithId = [id: string, crdt: SerializedCrdt];
export declare type InitialDocumentStateMessage = {
    type: ServerMessageType.InitialStorageState;
    items: SerializedCrdtWithId[];
};
export declare type UpdateStorageMessage = {
    type: ServerMessageType.UpdateStorage;
    ops: Op[];
};
export declare type ClientMessage = ClientEventMessage | UpdatePresenceClientMessage | UpdateStorageClientMessage | FetchStorageClientMessage;
export declare enum ClientMessageType {
    UpdatePresence = 100,
    ClientEvent = 103,
    FetchStorage = 200,
    UpdateStorage = 201
}
export declare type ClientEventMessage = {
    type: ClientMessageType.ClientEvent;
    event: any;
};
export declare type UpdatePresenceClientMessage = {
    type: ClientMessageType.UpdatePresence;
    data: Presence;
    targetActor?: number;
};
export declare type UpdateStorageClientMessage = {
    type: ClientMessageType.UpdateStorage;
    ops: Op[];
};
export declare type FetchStorageClientMessage = {
    type: ClientMessageType.FetchStorage;
};
export declare enum CrdtType {
    Object = 0,
    List = 1,
    Map = 2,
    Register = 3
}
export declare type SerializedObject = {
    type: CrdtType.Object;
    parentId?: string;
    parentKey?: string;
    data: {
        [key: string]: any;
    };
};
export declare type SerializedList = {
    type: CrdtType.List;
    parentId: string;
    parentKey: string;
};
export declare type SerializedMap = {
    type: CrdtType.Map;
    parentId: string;
    parentKey: string;
};
export declare type SerializedRegister = {
    type: CrdtType.Register;
    parentId: string;
    parentKey: string;
    data: any;
};
export declare type SerializedCrdt = SerializedObject | SerializedList | SerializedMap | SerializedRegister;
export declare enum OpType {
    Init = 0,
    SetParentKey = 1,
    CreateList = 2,
    UpdateObject = 3,
    CreateObject = 4,
    DeleteCrdt = 5,
    DeleteObjectKey = 6,
    CreateMap = 7,
    CreateRegister = 8
}
export declare type Op = CreateObjectOp | UpdateObjectOp | DeleteCrdtOp | CreateListOp | SetParentKeyOp | DeleteObjectKeyOp | CreateMapOp | CreateRegisterOp;
export declare type UpdateObjectOp = {
    opId?: string;
    id: string;
    type: OpType.UpdateObject;
    data: {
        [key: string]: any;
    };
};
export declare type CreateObjectOp = {
    opId?: string;
    id: string;
    type: OpType.CreateObject;
    parentId?: string;
    parentKey?: string;
    data: {
        [key: string]: any;
    };
};
export declare type CreateListOp = {
    opId?: string;
    id: string;
    type: OpType.CreateList;
    parentId: string;
    parentKey: string;
};
export declare type CreateMapOp = {
    opId?: string;
    id: string;
    type: OpType.CreateMap;
    parentId: string;
    parentKey: string;
};
export declare type CreateRegisterOp = {
    opId?: string;
    id: string;
    type: OpType.CreateRegister;
    parentId: string;
    parentKey: string;
    data: any;
};
export declare type DeleteCrdtOp = {
    opId?: string;
    id: string;
    type: OpType.DeleteCrdt;
};
export declare type SetParentKeyOp = {
    opId?: string;
    id: string;
    type: OpType.SetParentKey;
    parentKey: string;
};
export declare type DeleteObjectKeyOp = {
    opId?: string;
    id: string;
    type: OpType.DeleteObjectKey;
    key: string;
};
export declare enum WebsocketCloseCodes {
    CLOSE_ABNORMAL = 1006,
    INVALID_MESSAGE_FORMAT = 4000,
    NOT_ALLOWED = 4001,
    MAX_NUMBER_OF_MESSAGES_PER_SECONDS = 4002,
    MAX_NUMBER_OF_CONCURRENT_CONNECTIONS = 4003,
    MAX_NUMBER_OF_MESSAGES_PER_DAY_PER_APP = 4004,
    MAX_NUMBER_OF_CONCURRENT_CONNECTIONS_PER_ROOM = 4005
}
