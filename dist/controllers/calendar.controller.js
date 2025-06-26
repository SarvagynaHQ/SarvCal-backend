"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleCalendarConflictsController = void 0;
const asyncHandler_middeware_1 = require("../middlewares/asyncHandler.middeware");
const http_config_1 = require("../config/http.config");
const calendar_service_1 = require("../services/calendar.service");
exports.getGoogleCalendarConflictsController = (0, asyncHandler_middeware_1.asyncHandler)(async (req, res) => {
    const { eventId } = req.params;
    const { date } = req.query;
    if (!eventId) {
        return res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
            message: "eventId is required",
        });
    }
    if (!date || typeof date !== "string") {
        return res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
            message: "date is required and must be in YYYY-MM-DD format",
        });
    }
    // Validate UUID format for eventId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
        return res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
            message: "Invalid eventId format. Must be a valid UUID.",
        });
    }
    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
            message: "Invalid date format. Must be YYYY-MM-DD.",
        });
    }
    const conflicts = await (0, calendar_service_1.getGoogleCalendarConflictsService)(eventId, date);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Calendar conflicts retrieved successfully",
        ...conflicts,
    });
});
