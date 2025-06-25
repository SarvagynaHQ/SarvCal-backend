"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleOAuth2Client = void 0;
const googleapis_1 = require("googleapis");
const app_config_1 = require("./app.config");
//Google oauth
exports.googleOAuth2Client = new googleapis_1.google.auth.OAuth2(app_config_1.config.GOOGLE_CLIENT_ID, app_config_1.config.GOOGLE_CLIENT_SECRET, app_config_1.config.GOOGLE_REDIRECT_URI);
//Zoom oauth
