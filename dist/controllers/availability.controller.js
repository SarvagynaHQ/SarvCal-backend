"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailabilityForPublicEventController = exports.updateAvailabilityController = exports.getUserAvailabilityController = void 0;
const asyncHandler_middeware_1 = require("../middlewares/asyncHandler.middeware");
const http_config_1 = require("../config/http.config");
const availability_service_1 = require("../services/availability.service");
const withValidation_middleware_1 = require("../middlewares/withValidation.middleware");
const availability_dto_1 = require("../database/dto/availability.dto");
const event_dto_1 = require("../database/dto/event.dto");
exports.getUserAvailabilityController = (0, asyncHandler_middeware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const availability = await (0, availability_service_1.getUserAvailabilityService)(userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Fetched availability successfully",
        availability,
    });
});
exports.updateAvailabilityController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(availability_dto_1.UpdateAvailabilityDto, "body", async (req, res, updateAvailabilityDto) => {
    const userId = req.user?.id;
    await (0, availability_service_1.updateAvailabilityService)(userId, updateAvailabilityDto);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Availability updated successfully",
    });
});
// For Public Event
exports.getAvailabilityForPublicEventController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(event_dto_1.EventIdDTO, "params", async (req, res, eventIdDto) => {
    const availability = await (0, availability_service_1.getAvailabilityForPublicEventService)(eventIdDto.eventId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Event availability fetched successfully",
        data: availability,
    });
});
