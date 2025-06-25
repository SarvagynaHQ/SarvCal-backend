"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookedSlotsController = exports.cancelMeetingController = exports.createMeetBookingForGuestController = exports.getUserMeetingsController = void 0;
const asyncHandler_middeware_1 = require("../middlewares/asyncHandler.middeware");
const http_config_1 = require("../config/http.config");
const meeting_enum_1 = require("../enums/meeting.enum");
const meeting_service_1 = require("../services/meeting.service");
const withValidation_middleware_1 = require("../middlewares/withValidation.middleware");
const meeting_dto_1 = require("../database/dto/meeting.dto");
exports.getUserMeetingsController = (0, asyncHandler_middeware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const filter = req.query.filter || meeting_enum_1.MeetingFilterEnum.UPCOMING;
    const meetings = await (0, meeting_service_1.getUserMeetingsService)(userId, filter);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Meetings fetched successfully",
        meetings,
    });
});
// For Public
exports.createMeetBookingForGuestController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(meeting_dto_1.CreateMeetingDto, "body", async (req, res, createMeetingDto) => {
    const { meetLink, meeting } = await (0, meeting_service_1.createMeetBookingForGuestService)(createMeetingDto);
    return res.status(http_config_1.HTTPSTATUS.CREATED).json({
        message: "Meeting scheduled successfully",
        data: {
            meetLink,
            meeting,
        },
    });
});
exports.cancelMeetingController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(meeting_dto_1.MeetingIdDTO, "params", async (req, res, meetingIdDto) => {
    await (0, meeting_service_1.cancelMeetingService)(meetingIdDto.meetingId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        messsage: "Meeting cancelled successfully",
    });
});
exports.getBookedSlotsController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(meeting_dto_1.EventIdDTO, "params", async (req, res, eventIdDto) => {
    const bookedSlots = await (0, meeting_service_1.getBookedSlotsByEventIdService)(eventIdDto.eventId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Booked slots retrieved successfully",
        bookedSlots,
    });
});
