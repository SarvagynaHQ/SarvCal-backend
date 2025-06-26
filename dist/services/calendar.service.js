"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleCalendarConflictsService = void 0;
const database_config_1 = require("../config/database.config");
const event_entity_1 = require("../database/entities/event.entity");
const integration_entity_1 = require("../database/entities/integration.entity");
const app_error_1 = require("../utils/app-error");
const integration_service_1 = require("./integration.service");
const oauth_config_1 = require("../config/oauth.config");
const googleapis_1 = require("googleapis");
// Calendar client helper function (duplicated from meeting service for now)
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
const getGoogleCalendarConflictsService = async (eventId, date) => {
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    // Find the event and get the user ID
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
        return {
            conflicts: [],
            hasIntegration: false,
            warning: "No Google Calendar integration found for this event owner"
        };
    }
    try {
        // Get Google Calendar events for the day
        const { calendar } = await getCalendarClient(calendarIntegration.app_type, calendarIntegration.access_token, calendarIntegration.refresh_token, calendarIntegration.expiry_date);
        const startOfDay = new Date(`${date}T00:00:00Z`);
        const endOfDay = new Date(`${date}T23:59:59Z`);
        const calendarEvents = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });
        // Extract conflicting time slots from Google Calendar
        const conflicts = [];
        if (calendarEvents.data.items) {
            for (const calendarEvent of calendarEvents.data.items) {
                if (calendarEvent.start?.dateTime && calendarEvent.end?.dateTime) {
                    const eventStart = new Date(calendarEvent.start.dateTime);
                    const eventEnd = new Date(calendarEvent.end.dateTime);
                    // Generate 30-minute time slots that overlap with this calendar event
                    const startHour = Math.floor(eventStart.getHours() + (eventStart.getMinutes() / 60));
                    const endHour = Math.ceil(eventEnd.getHours() + (eventEnd.getMinutes() / 60));
                    for (let hour = Math.max(9, startHour); hour < Math.min(17, endHour); hour += 0.5) {
                        const wholeHour = Math.floor(hour);
                        const minutes = (hour % 1) * 60;
                        const timeSlot = `${wholeHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        // Check if this time slot overlaps with the calendar event
                        const slotStart = new Date(`${date}T${timeSlot}:00`);
                        const slotEnd = new Date(slotStart.getTime() + (event.duration || 30) * 60000);
                        if (slotStart < eventEnd && slotEnd > eventStart) {
                            conflicts.push(timeSlot);
                        }
                    }
                }
            }
        }
        return {
            date,
            conflicts: [...new Set(conflicts)], // Remove duplicates
            hasIntegration: true,
            eventTitle: event.title,
            eventDuration: event.duration || 30
        };
    }
    catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        return {
            conflicts: [],
            hasIntegration: true,
            warning: "Could not fetch Google Calendar events. Please check your integration.",
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
};
exports.getGoogleCalendarConflictsService = getGoogleCalendarConflictsService;
