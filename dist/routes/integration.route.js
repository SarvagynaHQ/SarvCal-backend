"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_config_1 = require("../config/passport.config");
const integration_controller_1 = require("../controllers/integration.controller");
const integrationRoutes = (0, express_1.Router)();
integrationRoutes.get("/all", passport_config_1.passportAuthenticateJwt, integration_controller_1.getUserIntegrationsController);
integrationRoutes.get("/check/:appType", passport_config_1.passportAuthenticateJwt, integration_controller_1.checkIntegrationController);
integrationRoutes.get("/connect/:appType", passport_config_1.passportAuthenticateJwt, integration_controller_1.connectAppController);
integrationRoutes.get("/google/callback", integration_controller_1.googleOAuthCallbackController);
// New route for checking Google Calendar integration for a specific event
integrationRoutes.get("/google-calendar/check/:eventId", integration_controller_1.checkGoogleCalendarIntegrationController);
exports.default = integrationRoutes;
