"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseToken = void 0;
function fetchAuthorize(endpoint, room, publicApiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                room,
                publicApiKey,
            }),
        });
        if (!res.ok) {
            throw new AuthenticationError(`Authentication error. Liveblocks could not parse the response of your authentication "${endpoint}"`);
        }
        let authResponse = null;
        try {
            authResponse = yield res.json();
        }
        catch (er) {
            throw new AuthenticationError(`Authentication error. Liveblocks could not parse the response of your authentication "${endpoint}"`);
        }
        if (typeof authResponse.token !== "string") {
            throw new AuthenticationError(`Authentication error. Liveblocks could not parse the response of your authentication "${endpoint}"`);
        }
        return authResponse.token;
    });
}
function auth(endpoint, room, publicApiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        if (typeof endpoint === "string") {
            return fetchAuthorize(endpoint, room, publicApiKey);
        }
        if (typeof endpoint === "function") {
            const { token } = yield endpoint(room);
            // TODO: Validation
            return token;
        }
        throw new Error("Authentication error. Liveblocks could not parse the response of your authentication endpoint");
    });
}
exports.default = auth;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
    }
}
function parseToken(token) {
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
        throw new AuthenticationError(`Authentication error. Liveblocks could not parse the response of your authentication endpoint`);
    }
    const data = JSON.parse(atob(tokenParts[1]));
    if (typeof data.actor !== "number") {
        throw new AuthenticationError(`Authentication error. Liveblocks could not parse the response of your authentication endpoint`);
    }
    return data;
}
exports.parseToken = parseToken;
