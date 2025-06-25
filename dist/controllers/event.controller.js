"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEventController = exports.getPublicEventByUsernameAndSlugController = exports.getPublicEventsByUsernameController = exports.toggleEventPrivacyController = exports.getUserEventsController = exports.createEventController = void 0;
const http_config_1 = require("../config/http.config");
const withValidation_middleware_1 = require("../middlewares/withValidation.middleware");
const event_dto_1 = require("../database/dto/event.dto");
const event_service_1 = require("../services/event.service");
const asyncHandler_middeware_1 = require("../middlewares/asyncHandler.middeware");
exports.createEventController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(event_dto_1.CreateEventDto, "body", async (req, res, createEventDto) => {
    const userId = req.user?.id;
    const event = await (0, event_service_1.createEventService)(userId, createEventDto);
    return res.status(http_config_1.HTTPSTATUS.CREATED).json({
        message: "Event created successfully",
        event,
    });
});
exports.getUserEventsController = (0, asyncHandler_middeware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { events, username } = await (0, event_service_1.getUserEventsService)(userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "User event fetched successfully",
        data: {
            events,
            username,
        },
    });
});
exports.toggleEventPrivacyController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(event_dto_1.EventIdDTO, "body", async (req, res, eventIdDto) => {
    const userId = req.user?.id;
    const event = await (0, event_service_1.toggleEventPrivacyService)(userId, eventIdDto.eventId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: `Event set to ${event.isPrivate ? "private" : "public"} successfully`,
    });
});
exports.getPublicEventsByUsernameController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(event_dto_1.UserNameDTO, "params", async (req, res, userNameDto) => {
    const { user, events } = await (0, event_service_1.getPublicEventsByUsernameService)(userNameDto.username);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Public events fetched successfully",
        user,
        events,
    });
});
exports.getPublicEventByUsernameAndSlugController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(event_dto_1.UserNameAndSlugDTO, "params", async (req, res, userNameAndSlugDto) => {
    const event = await (0, event_service_1.getPublicEventByUsernameAndSlugService)(userNameAndSlugDto);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Event details fetched successfully",
        event,
    });
});
exports.deleteEventController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(event_dto_1.EventIdDTO, "params", async (req, res, eventIdDto) => {
    const userId = req.user?.id;
    await (0, event_service_1.deleteEventService)(userId, eventIdDto.eventId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Event deleted successfully",
    });
});
