"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMeetingService = exports.createMeetBookingForGuestService = exports.getUserMeetingsService = void 0;
const typeorm_1 = require("typeorm");
const database_config_1 = require("../config/database.config");
const meeting_entity_1 = require("../database/entities/meeting.entity");
const meeting_enum_1 = require("../enums/meeting.enum");
const event_entity_1 = require("../database/entities/event.entity");
const integration_entity_1 = require("../database/entities/integration.entity");
const app_error_1 = require("../utils/app-error");
const integration_service_1 = require("./integration.service");
const oauth_config_1 = require("../config/oauth.config");
const googleapis_1 = require("googleapis");
const getUserMeetingsService = async (userId, filter) => {
    const meetingRepository = database_config_1.AppDataSource.getRepository(meeting_entity_1.Meeting);
    const where = { user: { id: userId } };
    if (filter === meeting_enum_1.MeetingFilterEnum.UPCOMING) {
        where.status = meeting_entity_1.MeetingStatus.SCHEDULED;
        where.startTime = (0, typeorm_1.MoreThan)(new Date());
    }
    else if (filter === meeting_enum_1.MeetingFilterEnum.PAST) {
        where.status = meeting_entity_1.MeetingStatus.SCHEDULED;
        where.startTime = (0, typeorm_1.LessThan)(new Date());
    }
    else if (filter === meeting_enum_1.MeetingFilterEnum.CANCELLED) {
        where.status = meeting_entity_1.MeetingStatus.CANCELLED;
    }
    else {
        where.status = meeting_entity_1.MeetingStatus.SCHEDULED;
        where.startTime = (0, typeorm_1.MoreThan)(new Date());
    }
    const meetings = await meetingRepository.find({
        where,
        relations: ["event"],
        order: { startTime: "ASC" },
    });
    return meetings || [];
};
exports.getUserMeetingsService = getUserMeetingsService;
const createMeetBookingForGuestService = async (createMeetingDto) => {
    const { eventId, guestEmail, guestName, additionalInfo } = createMeetingDto;
    const startTime = new Date(createMeetingDto.startTime);
    const endTime = new Date(createMeetingDto.endTime);
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    const meetingRepository = database_config_1.AppDataSource.getRepository(meeting_entity_1.Meeting);
    const event = await eventRepository.findOne({
        where: { id: eventId, isPrivate: false },
        relations: ["user"],
    });
    if (!event)
        throw new app_error_1.NotFoundException("Event not found");
    if (!Object.values(event_entity_1.EventLocationEnumType).includes(event.locationType)) {
        throw new app_error_1.BadRequestException("Invalid location type");
    }
    const meetIntegration = await integrationRepository.findOne({
        where: {
            user: { id: event.user.id },
            app_type: integration_entity_1.IntegrationAppTypeEnum[event.locationType],
        },
    });
    if (!meetIntegration)
        throw new app_error_1.BadRequestException("No video conferencing integration found");
    let meetLink = "";
    let calendarEventId = "";
    let calendarAppType = "";
    if (event.locationType === event_entity_1.EventLocationEnumType.GOOGLE_MEET_AND_CALENDAR) {
        const { calendarType, calendar } = await getCalendarClient(meetIntegration.app_type, meetIntegration.access_token, meetIntegration.refresh_token, meetIntegration.expiry_date);
        const response = await calendar.events.insert({
            calendarId: "primary",
            conferenceDataVersion: 1,
            requestBody: {
                summary: `${guestName} - ${event.title}`,
                description: additionalInfo,
                start: { dateTime: startTime.toISOString() },
                end: { dateTime: endTime.toISOString() },
                attendees: [{ email: guestEmail }, { email: event.user.email }],
                conferenceData: {
                    createRequest: {
                        requestId: `${event.id}-${Date.now()}`,
                    },
                },
            },
        });
        meetLink = response.data.hangoutLink;
        calendarEventId = response.data.id;
        calendarAppType = calendarType;
    }
    const meeting = meetingRepository.create({
        event: { id: event.id },
        user: event.user,
        guestName,
        guestEmail,
        additionalInfo,
        startTime,
        endTime,
        meetLink: meetLink,
        calendarEventId: calendarEventId,
        calendarAppType: calendarAppType,
    });
    await meetingRepository.save(meeting);
    return {
        meetLink,
        meeting,
    };
};
exports.createMeetBookingForGuestService = createMeetBookingForGuestService;
const cancelMeetingService = async (meetingId) => {
    const meetingRepository = database_config_1.AppDataSource.getRepository(meeting_entity_1.Meeting);
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    const meeting = await meetingRepository.findOne({
        where: { id: meetingId },
        relations: ["event", "event.user"],
    });
    if (!meeting)
        throw new app_error_1.NotFoundException("Meeting not found");
    try {
        const calendarIntegration = await integrationRepository.findOne({
            where: {
                app_type: integration_entity_1.IntegrationAppTypeEnum[meeting.calendarAppType],
            },
        });
        // const calendarIntegration = await integrationRepository.findOne({
        //   where: [
        //     {
        //       user: { id: meeting.event.user.id },
        //       category: IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
        //     },
        //     {
        //       user: { id: meeting.event.user.id },
        //       category: IntegrationCategoryEnum.CALENDAR,
        //     },
        //   ],
        // });
        if (calendarIntegration) {
            const { calendar, calendarType } = await getCalendarClient(calendarIntegration.app_type, calendarIntegration.access_token, calendarIntegration.refresh_token, calendarIntegration.expiry_date);
            switch (calendarType) {
                case integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
                    await calendar.events.delete({
                        calendarId: "primary",
                        eventId: meeting.calendarEventId,
                    });
                    break;
                default:
                    throw new app_error_1.BadRequestException(`Unsupported calendar provider: ${calendarType}`);
            }
        }
    }
    catch (error) {
        throw new app_error_1.BadRequestException("Failed to delete event from calendar");
    }
    meeting.status = meeting_entity_1.MeetingStatus.CANCELLED;
    await meetingRepository.save(meeting);
    return { success: true };
};
exports.cancelMeetingService = cancelMeetingService;
async function getCalendarClient(appType, access_token, refresh_token, expiry_date) {
    switch (appType) {
        case integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
            const validToken = await (0, integration_service_1.validateGoogleToken)(access_token, refresh_token, expiry_date);
            oauth_config_1.googleOAuth2Client.setCredentials({ access_token: validToken });
            const calendar = googleapis_1.google.calendar({
                version: "v3",
                auth: oauth_config_1.googleOAuth2Client,
            });
            return {
                calendar,
                calendarType: integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
            };
        default:
            throw new app_error_1.BadRequestException(`Unsupported Calendar provider: ${appType}`);
    }
}
