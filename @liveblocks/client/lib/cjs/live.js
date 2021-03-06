"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketCloseCodes = exports.OpType = exports.CrdtType = exports.ClientMessageType = exports.ServerMessageType = void 0;
var ServerMessageType;
(function (ServerMessageType) {
    ServerMessageType[ServerMessageType["UpdatePresence"] = 100] = "UpdatePresence";
    ServerMessageType[ServerMessageType["UserJoined"] = 101] = "UserJoined";
    ServerMessageType[ServerMessageType["UserLeft"] = 102] = "UserLeft";
    ServerMessageType[ServerMessageType["Event"] = 103] = "Event";
    ServerMessageType[ServerMessageType["RoomState"] = 104] = "RoomState";
    ServerMessageType[ServerMessageType["InitialStorageState"] = 200] = "InitialStorageState";
    ServerMessageType[ServerMessageType["UpdateStorage"] = 201] = "UpdateStorage";
})(ServerMessageType = exports.ServerMessageType || (exports.ServerMessageType = {}));
var ClientMessageType;
(function (ClientMessageType) {
    ClientMessageType[ClientMessageType["UpdatePresence"] = 100] = "UpdatePresence";
    ClientMessageType[ClientMessageType["ClientEvent"] = 103] = "ClientEvent";
    ClientMessageType[ClientMessageType["FetchStorage"] = 200] = "FetchStorage";
    ClientMessageType[ClientMessageType["UpdateStorage"] = 201] = "UpdateStorage";
})(ClientMessageType = exports.ClientMessageType || (exports.ClientMessageType = {}));
var CrdtType;
(function (CrdtType) {
    CrdtType[CrdtType["Object"] = 0] = "Object";
    CrdtType[CrdtType["List"] = 1] = "List";
    CrdtType[CrdtType["Map"] = 2] = "Map";
    CrdtType[CrdtType["Register"] = 3] = "Register";
})(CrdtType = exports.CrdtType || (exports.CrdtType = {}));
var OpType;
(function (OpType) {
    OpType[OpType["Init"] = 0] = "Init";
    OpType[OpType["SetParentKey"] = 1] = "SetParentKey";
    OpType[OpType["CreateList"] = 2] = "CreateList";
    OpType[OpType["UpdateObject"] = 3] = "UpdateObject";
    OpType[OpType["CreateObject"] = 4] = "CreateObject";
    OpType[OpType["DeleteCrdt"] = 5] = "DeleteCrdt";
    OpType[OpType["DeleteObjectKey"] = 6] = "DeleteObjectKey";
    OpType[OpType["CreateMap"] = 7] = "CreateMap";
    OpType[OpType["CreateRegister"] = 8] = "CreateRegister";
})(OpType = exports.OpType || (exports.OpType = {}));
var WebsocketCloseCodes;
(function (WebsocketCloseCodes) {
    WebsocketCloseCodes[WebsocketCloseCodes["CLOSE_ABNORMAL"] = 1006] = "CLOSE_ABNORMAL";
    WebsocketCloseCodes[WebsocketCloseCodes["INVALID_MESSAGE_FORMAT"] = 4000] = "INVALID_MESSAGE_FORMAT";
    WebsocketCloseCodes[WebsocketCloseCodes["NOT_ALLOWED"] = 4001] = "NOT_ALLOWED";
    WebsocketCloseCodes[WebsocketCloseCodes["MAX_NUMBER_OF_MESSAGES_PER_SECONDS"] = 4002] = "MAX_NUMBER_OF_MESSAGES_PER_SECONDS";
    WebsocketCloseCodes[WebsocketCloseCodes["MAX_NUMBER_OF_CONCURRENT_CONNECTIONS"] = 4003] = "MAX_NUMBER_OF_CONCURRENT_CONNECTIONS";
    WebsocketCloseCodes[WebsocketCloseCodes["MAX_NUMBER_OF_MESSAGES_PER_DAY_PER_APP"] = 4004] = "MAX_NUMBER_OF_MESSAGES_PER_DAY_PER_APP";
    WebsocketCloseCodes[WebsocketCloseCodes["MAX_NUMBER_OF_CONCURRENT_CONNECTIONS_PER_ROOM"] = 4005] = "MAX_NUMBER_OF_CONCURRENT_CONNECTIONS_PER_ROOM";
})(WebsocketCloseCodes = exports.WebsocketCloseCodes || (exports.WebsocketCloseCodes = {}));
