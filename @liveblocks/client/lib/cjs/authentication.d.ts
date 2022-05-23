import { AuthEndpoint, AuthenticationToken } from "./types";
export default function auth(endpoint: AuthEndpoint, room: string, publicApiKey?: string): Promise<string>;
export declare function parseToken(token: string): AuthenticationToken;
