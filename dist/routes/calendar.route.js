"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calendar_controller_1 = require("../controllers/calendar.controller");
const calendarRoutes = (0, express_1.Router)();
// Route to get Google Calendar conflicts for a specific event and date
calendarRoutes.get("/google/conflicts/:eventId", calendar_controller_1.getGoogleCalendarConflictsController);
exports.default = calendarRoutes;
