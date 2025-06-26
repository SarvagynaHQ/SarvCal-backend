import { AppDataSource } from "../config/database.config";
import { Event } from "../database/entities/event.entity";
import { Integration, IntegrationAppTypeEnum } from "../database/entities/integration.entity";
import { NotFoundException, BadRequestException } from "../utils/app-error";  
import { validateGoogleToken } from "./integration.service";
import { googleOAuth2Client } from "../config/oauth.config";
import { google } from "googleapis";

// Calendar client helper function (duplicated from meeting service for now)
async function getCalendarClient(
  appType: IntegrationAppTypeEnum,
  access_token: string,
  refresh_token: string,
  expiry_date: number | null
) {
  switch (appType) {
    case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
      const validToken = await validateGoogleToken(
        access_token,
        refresh_token,
        expiry_date
      );
      googleOAuth2Client.setCredentials({ access_token: validToken });
      const calendar = google.calendar({
        version: "v3",
        auth: googleOAuth2Client,
      });
      return {
        calendar,
        calendarType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
      };
    default:
      throw new BadRequestException(
        `Unsupported Calendar provider: ${appType}`
      );
  }
}

export const getGoogleCalendarConflictsService = async (eventId: string, date: string) => {
  const eventRepository = AppDataSource.getRepository(Event);
  const integrationRepository = AppDataSource.getRepository(Integration);

  // Find the event and get the user ID
  const event = await eventRepository.findOne({
    where: { id: eventId },
    relations: ["user"]
  });

  if (!event) {
    throw new NotFoundException("Event not found");
  }

  // Get calendar integration for the event owner
  const calendarIntegration = await integrationRepository.findOne({
    where: {
      user: { id: event.user.id },
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
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
    const { calendar } = await getCalendarClient(
      calendarIntegration.app_type,
      calendarIntegration.access_token,
      calendarIntegration.refresh_token,
      calendarIntegration.expiry_date
    );

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
    const conflicts: string[] = [];
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

  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return {
      conflicts: [],
      hasIntegration: true,
      warning: "Could not fetch Google Calendar events. Please check your integration.",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
