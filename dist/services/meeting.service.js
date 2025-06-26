"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMeetingDetailsService = exports.rescheduleMeetingService = exports.cancelMeetingService = exports.createMeetBookingForGuestService = exports.getAllBookedSlotsService = exports.getAvailableSlotsService = exports.getBookedSlotsByEventIdService = exports.getUserMeetingsService = void 0;
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
const email_service_1 = require("./email.service");
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
const getBookedSlotsByEventIdService = async (eventId) => {
    const meetingRepository = database_config_1.AppDataSource.getRepository(meeting_entity_1.Meeting);
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    // First verify the event exists
    const event = await eventRepository.findOne({
        where: { id: eventId }
    });
    if (!event) {
        throw new app_error_1.NotFoundException("Event not found");
    }
    // Get all scheduled meetings for this event
    const bookedMeetings = await meetingRepository.find({
        where: {
            event: { id: eventId },
            status: meeting_entity_1.MeetingStatus.SCHEDULED,
            startTime: (0, typeorm_1.MoreThan)(new Date()) // Only future meetings
        },
        order: { startTime: "ASC" }
    });
    // Extract time slots in HH:MM format
    const bookedSlots = bookedMeetings.map(meeting => {
        const startTime = new Date(meeting.startTime);
        return startTime.toTimeString().slice(0, 5); // Extract HH:MM format
    });
    return bookedSlots;
};
exports.getBookedSlotsByEventIdService = getBookedSlotsByEventIdService;
const getAvailableSlotsService = async (eventId, date) => {
    const meetingRepository = database_config_1.AppDataSource.getRepository(meeting_entity_1.Meeting);
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    // Get the event with user info
    const event = await eventRepository.findOne({
        where: { id: eventId },
        relations: ["user"]
    });
    if (!event) {
        throw new app_error_1.NotFoundException("Event not found");
    }
    // Get calendar integration for the event owner
    const calendarIntegration = await integrationRepository.findOne({
        where: {
            user: { id: event.user.id },
            app_type: integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
        },
    });
    if (!calendarIntegration) {
        throw new app_error_1.BadRequestException("No Google Calendar integration found for this event");
    }
    // Parse the date and validate it's not in the past
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
        throw new app_error_1.BadRequestException("Cannot check availability for past dates");
    }
    // Create time boundaries for the requested date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);
    // Generate potential time slots based on working hours
    const potentialSlots = [];
    const workingHours = {
        start: 9, // 9 AM
        end: 17, // 5 PM
        interval: 30 // 30 minutes
    };
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        for (let minute = 0; minute < 60; minute += workingHours.interval) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            potentialSlots.push(timeString);
        }
    }
    // Get existing booked meetings for this event on the requested date
    const bookedMeetings = await meetingRepository.find({
        where: {
            event: { id: eventId },
            status: meeting_entity_1.MeetingStatus.SCHEDULED,
            startTime: (0, typeorm_1.MoreThan)(startOfDay),
            endTime: (0, typeorm_1.LessThan)(endOfDay)
        }
    });
    const bookedSlots = bookedMeetings.map(meeting => {
        const startTime = new Date(meeting.startTime);
        return startTime.toTimeString().slice(0, 5);
    });
    // Filter out slots that are too close to current time (e.g., less than 1 hour from now)
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const filteredSlots = potentialSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotDateTime = new Date(requestedDate);
        slotDateTime.setHours(slotHour, slotMinute, 0, 0);
        // For today, only show slots that are at least 1 hour from now
        if (requestedDate.toDateString() === now.toDateString()) {
            return slotDateTime >= minBookingTime;
        }
        return true;
    });
    try {
        // Get Google Calendar events for the day
        const { calendar } = await getCalendarClient(calendarIntegration.app_type, calendarIntegration.access_token, calendarIntegration.refresh_token, calendarIntegration.expiry_date);
        const calendarEvents = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });
        // Extract conflicting time slots from Google Calendar
        const calendarConflicts = [];
        if (calendarEvents.data.items) {
            for (const calendarEvent of calendarEvents.data.items) {
                if (calendarEvent.start?.dateTime && calendarEvent.end?.dateTime) {
                    const eventStart = new Date(calendarEvent.start.dateTime);
                    const eventEnd = new Date(calendarEvent.end.dateTime);
                    // Skip all-day events or events without specific times
                    if (!calendarEvent.start.dateTime || !calendarEvent.end.dateTime) {
                        continue;
                    }
                    // Find all time slots that overlap with this calendar event
                    for (const slot of filteredSlots) {
                        const [slotHour, slotMinute] = slot.split(':').map(Number);
                        const slotStart = new Date(requestedDate);
                        slotStart.setHours(slotHour, slotMinute, 0, 0);
                        const slotEnd = new Date(slotStart);
                        slotEnd.setMinutes(slotEnd.getMinutes() + event.duration);
                        // Check if slot overlaps with calendar event
                        if (slotStart < eventEnd && slotEnd > eventStart) {
                            calendarConflicts.push(slot);
                        }
                    }
                }
            }
        }
        // Filter out booked slots and calendar conflicts
        const availableSlots = filteredSlots.filter(slot => !bookedSlots.includes(slot) && !calendarConflicts.includes(slot));
        return {
            date,
            availableSlots,
            bookedSlots,
            calendarConflicts: [...new Set(calendarConflicts)], // Remove duplicates
            eventDuration: event.duration,
            workingHours: `${workingHours.start}:00 - ${workingHours.end}:00`,
            minimumNotice: "60 minutes"
        };
    }
    catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        // Fallback: return slots without calendar sync
        const availableSlots = filteredSlots.filter(slot => !bookedSlots.includes(slot));
        return {
            date,
            availableSlots,
            bookedSlots,
            calendarConflicts: [],
            eventDuration: event.duration,
            workingHours: `${workingHours.start}:00 - ${workingHours.end}:00`,
            minimumNotice: "60 minutes",
            warning: "Could not sync with Google Calendar. Showing availability based on booked meetings only."
        };
    }
};
exports.getAvailableSlotsService = getAvailableSlotsService;
const getAllBookedSlotsService = async (dateString) => {
    const meetingRepository = database_config_1.AppDataSource.getRepository(meeting_entity_1.Meeting);
    // Parse the date and create start/end of day
    const requestedDate = new Date(dateString);
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);
    // Get all scheduled meetings for the requested date across all events
    const bookedMeetings = await meetingRepository.find({
        where: {
            status: meeting_entity_1.MeetingStatus.SCHEDULED,
            startTime: (0, typeorm_1.MoreThan)(startOfDay),
            endTime: (0, typeorm_1.LessThan)(endOfDay)
        },
        relations: ['event'],
        select: {
            id: true,
            startTime: true,
            endTime: true,
            event: {
                id: true,
                title: true,
                duration: true
            }
        }
    });
    // Convert meetings to time slot format
    const bookedSlots = bookedMeetings.map(meeting => {
        const startTime = new Date(meeting.startTime);
        return {
            time: startTime.toTimeString().slice(0, 5), // HH:MM format
            startTime: meeting.startTime.toISOString(),
            endTime: meeting.endTime.toISOString(),
            eventId: meeting.event.id,
            eventTitle: meeting.event.title,
            duration: meeting.event.duration
        };
    });
    return bookedSlots;
};
exports.getAllBookedSlotsService = getAllBookedSlotsService;
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
    // Send email notifications
    try {
        // Send confirmation email to guest
        await (0, email_service_1.sendMeetingConfirmationEmail)(meeting, event);
        // Send notification email to host
        await (0, email_service_1.sendHostNotificationEmail)(meeting, event);
    }
    catch (emailError) {
        console.error('Failed to send meeting emails:', emailError);
        // Don't fail the meeting creation if email fails
    }
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
    // Send cancellation email notifications
    try {
        await (0, email_service_1.sendMeetingCancellationEmail)(meeting, meeting.event, 'host');
    }
    catch (emailError) {
        console.error('Failed to send cancellation emails:', emailError);
        // Don't fail the cancellation if email fails
    }
    return { success: true };
};
exports.cancelMeetingService = cancelMeetingService;
const rescheduleMeetingService = async (rescheduleDto) => {
    const meetingRepository = database_config_1.AppDataSource.getRepository(meeting_entity_1.Meeting);
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    const meeting = await meetingRepository.findOne({
        where: { id: rescheduleDto.meetingId },
        relations: ["event", "event.user"]
    });
    if (!meeting) {
        throw new app_error_1.NotFoundException("Meeting not found");
    }
    if (meeting.status === meeting_entity_1.MeetingStatus.CANCELLED) {
        throw new app_error_1.BadRequestException("Cannot reschedule a cancelled meeting");
    }
    const newStartTime = new Date(rescheduleDto.newStartTime);
    const newEndTime = new Date(rescheduleDto.newEndTime);
    // Update calendar event if it exists
    if (meeting.calendarEventId) {
        try {
            const calendarIntegration = await integrationRepository.findOne({
                where: {
                    user: { id: meeting.event.user.id },
                    app_type: integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
                }
            });
            if (calendarIntegration) {
                const { calendar } = await getCalendarClient(calendarIntegration.app_type, calendarIntegration.access_token, calendarIntegration.refresh_token, calendarIntegration.expiry_date);
                await calendar.events.patch({
                    calendarId: "primary",
                    eventId: meeting.calendarEventId,
                    requestBody: {
                        start: { dateTime: newStartTime.toISOString() },
                        end: { dateTime: newEndTime.toISOString() }
                    }
                });
            }
        }
        catch (error) {
            console.error("Failed to update calendar event:", error);
            throw new app_error_1.BadRequestException("Failed to update calendar event");
        }
    }
    // Update meeting in database
    meeting.startTime = newStartTime;
    meeting.endTime = newEndTime;
    await meetingRepository.save(meeting);
    // Send updated confirmation emails
    try {
        await (0, email_service_1.sendMeetingConfirmationEmail)(meeting, meeting.event);
        await (0, email_service_1.sendHostNotificationEmail)(meeting, meeting.event);
    }
    catch (emailError) {
        console.error('Failed to send reschedule emails:', emailError);
        // Don't fail the rescheduling if email fails
    }
    return meeting;
};
exports.rescheduleMeetingService = rescheduleMeetingService;
const getMeetingDetailsService = async (meetingId) => {
    const meetingRepository = database_config_1.AppDataSource.getRepository(meeting_entity_1.Meeting);
    const meeting = await meetingRepository.findOne({
        where: { id: meetingId },
        relations: ["event", "event.user"]
    });
    if (!meeting) {
        throw new app_error_1.NotFoundException("Meeting not found");
    }
    return meeting;
};
exports.getMeetingDetailsService = getMeetingDetailsService;
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
