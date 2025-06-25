"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_config_1 = require("../config/passport.config");
const event_controller_1 = require("../controllers/event.controller");
const eventRoutes = (0, express_1.Router)();
eventRoutes.post("/create", passport_config_1.passportAuthenticateJwt, event_controller_1.createEventController);
eventRoutes.get("/all", passport_config_1.passportAuthenticateJwt, event_controller_1.getUserEventsController);
// for public without token
eventRoutes.get("/public/:username", event_controller_1.getPublicEventsByUsernameController);
eventRoutes.get("/public/:username/:slug", event_controller_1.getPublicEventByUsernameAndSlugController);
eventRoutes.put("/toggle-privacy", passport_config_1.passportAuthenticateJwt, event_controller_1.toggleEventPrivacyController);
eventRoutes.delete("/:eventId", passport_config_1.passportAuthenticateJwt, event_controller_1.deleteEventController);
exports.default = eventRoutes;
