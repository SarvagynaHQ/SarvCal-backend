"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.encodeState = encodeState;
exports.decodeState = decodeState;
const uuid_1 = require("uuid");
const js_base64_1 = require("js-base64");
function slugify(text) {
    const uuid = (0, uuid_1.v4)().replace(/\s+/g, "").slice(0, 4);
    const slug = text
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
    return `${slug}-${uuid}`;
}
function encodeState(data) {
    return (0, js_base64_1.encode)(JSON.stringify(data));
}
function decodeState(state) {
    return JSON.parse((0, js_base64_1.decode)(state));
}
