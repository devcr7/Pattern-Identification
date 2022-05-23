"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.pos = exports.posCodes = exports.makePosition = exports.max = exports.min = void 0;
exports.min = 32;
exports.max = 126;
function makePosition(before, after) {
    // No children
    if (before == null && after == null) {
        return pos([exports.min + 1]);
    }
    // Insert at the end
    if (before != null && after == null) {
        return getNextPosition(before);
    }
    // Insert at the start
    if (before == null && after != null) {
        return getPreviousPosition(after);
    }
    return pos(makePositionFromCodes(posCodes(before), posCodes(after)));
}
exports.makePosition = makePosition;
function getPreviousPosition(after) {
    const result = [];
    const afterCodes = posCodes(after);
    for (let i = 0; i < afterCodes.length; i++) {
        const code = afterCodes[i];
        if (code <= exports.min + 1) {
            result.push(exports.min);
            if (afterCodes.length - 1 === i) {
                result.push(exports.max);
                break;
            }
        }
        else {
            result.push(code - 1);
            break;
        }
    }
    return pos(result);
}
function getNextPosition(before) {
    const result = [];
    const beforeCodes = posCodes(before);
    for (let i = 0; i < beforeCodes.length; i++) {
        const code = beforeCodes[i];
        if (code === exports.max) {
            result.push(code);
            if (beforeCodes.length - 1 === i) {
                result.push(exports.min + 1);
                break;
            }
        }
        else {
            result.push(code + 1);
            break;
        }
    }
    return pos(result);
}
function makePositionFromCodes(before, after) {
    let index = 0;
    const result = [];
    while (true) {
        const beforeDigit = before[index] || exports.min;
        const afterDigit = after[index] || exports.max;
        if (beforeDigit > afterDigit) {
            throw new Error(`Impossible to generate position between ${before} and ${after}`);
        }
        if (beforeDigit === afterDigit) {
            result.push(beforeDigit);
            index++;
            continue;
        }
        if (afterDigit - beforeDigit === 1) {
            result.push(beforeDigit);
            result.push(...makePositionFromCodes(before.slice(index + 1), []));
            break;
        }
        const mid = (afterDigit + beforeDigit) >> 1;
        result.push(mid);
        break;
    }
    return result;
}
function posCodes(str) {
    const codes = [];
    for (let i = 0; i < str.length; i++) {
        codes.push(str.charCodeAt(i));
    }
    return codes;
}
exports.posCodes = posCodes;
function pos(codes) {
    return String.fromCharCode(...codes);
}
exports.pos = pos;
function compare(posA, posB) {
    const aCodes = posCodes(posA);
    const bCodes = posCodes(posB);
    const maxLength = Math.max(aCodes.length, bCodes.length);
    for (let i = 0; i < maxLength; i++) {
        const a = aCodes[i] == null ? exports.min : aCodes[i];
        const b = bCodes[i] == null ? exports.min : bCodes[i];
        if (a === b) {
            continue;
        }
        else {
            return a - b;
        }
    }
    throw new Error(`Impossible to compare similar position "${posA}" and "${posB}"`);
}
exports.compare = compare;
