"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signJwtToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_config_1 = require("../config/app.config");
const defaults = {
    audience: ["user"],
};
const accessTokenSignOptions = {
    expiresIn: "1d",
    secret: app_config_1.config.JWT_SECRET,
};
const signJwtToken = (payload, options) => {
    const { secret, ...opts } = options || accessTokenSignOptions;
    const token = jsonwebtoken_1.default.sign(payload, secret, {
        ...defaults,
        ...opts,
    });
    const decodedToken = jsonwebtoken_1.default.decode(token);
    const expiresAt = decodedToken?.exp ? decodedToken.exp * 1000 : null;
    return {
        token,
        expiresAt,
    };
};
exports.signJwtToken = signJwtToken;
