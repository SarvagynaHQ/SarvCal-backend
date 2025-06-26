import { LessThan, MoreThan } from "typeorm";
import { AppDataSource } from "../config/database.config";
import { Meeting, MeetingStatus } from "../database/entities/meeting.entity";
import {
  MeetingFilterEnum,
  MeetingFilterEnumType,
} from "../enums/meeting.enum";
import { CreateMeetingDto } from "../database/dto/meeting.dto";
import {
  Event,
  EventLocationEnumType,
} from "../database/entities/event.entity";
import {
  Integration,
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum,
} from "../database/entities/integration.entity";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import { validateGoogleToken } from "./integration.service";
import { googleOAuth2Client } from "../config/oauth.config";
import { google } from "googleapis";

export const getUserMeetingsService = async (
  userId: string,
  filter: MeetingFilterEnumType
) => {
  const meetingRepository = AppDataSource.getRepository(Meeting);

  const where: any = { user: { id: userId } };

  if (filter === MeetingFilterEnum.UPCOMING) {
    where.status = MeetingStatus.SCHEDULED;
    where.startTime = MoreThan(new Date());
  } else if (filter === MeetingFilterEnum.PAST) {
    where.status = MeetingStatus.SCHEDULED;
    where.startTime = LessThan(new Date());
  } else if (filter === MeetingFilterEnum.CANCELLED) {
    where.status = MeetingStatus.CANCELLED;
  } else {
    where.status = MeetingStatus.SCHEDULED;
    where.startTime = MoreThan(new Date());
  }

  const meetings = await meetingRepository.find({
    where,
    relations: ["event"],
    order: { startTime: "ASC" },
  });

  return meetings || [];
};

export const getBookedSlotsByEventIdService = async (eventId: string) => {
  const meetingRepository = AppDataSource.getRepository(Meeting);
  const eventRepository = AppDataSource.getRepository(Event);

  // First verify the event exists
  const event = await eventRepository.findOne({
    where: { id: eventId }
  });

  if (!event) {
    throw new NotFoundException("Event not found");
  }

  // Get all scheduled meetings for this event
  const bookedMeetings = await meetingRepository.find({
    where: {
      event: { id: eventId },
      status: MeetingStatus.SCHEDULED,
      startTime: MoreThan(new Date()) // Only future meetings
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

export const getAvailableSlotsService = async (eventId: string, date: string) => {
  const meetingRepository = AppDataSource.getRepository(Meeting);
  const eventRepository = AppDataSource.getRepository(Event);
  const integrationRepository = AppDataSource.getRepository(Integration);

  // Get the event with user info
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
    throw new BadRequestException("No Google Calendar integration found for this event");
  }

  // Parse the date and validate it's not in the past
  const requestedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (requestedDate < today) {
    throw new BadRequestException("Cannot check availability for past dates");
  }

  // Create time boundaries for the requested date
  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(requestedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Generate potential time slots based on working hours
  const potentialSlots: string[] = [];
  const workingHours = {
    start: 9, // 9 AM
    end: 17,  // 5 PM
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
      status: MeetingStatus.SCHEDULED,
      startTime: MoreThan(startOfDay),
      endTime: LessThan(endOfDay)
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
    const { calendar } = await getCalendarClient(
      calendarIntegration.app_type,
      calendarIntegration.access_token,
      calendarIntegration.refresh_token,
      calendarIntegration.expiry_date
    );

    const calendarEvents = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // Extract conflicting time slots from Google Calendar
    const calendarConflicts: string[] = [];
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
    const availableSlots = filteredSlots.filter(slot => 
      !bookedSlots.includes(slot) && !calendarConflicts.includes(slot)
    );

    return {
      date,
      availableSlots,
      bookedSlots,
      calendarConflicts: [...new Set(calendarConflicts)], // Remove duplicates
      eventDuration: event.duration,
      workingHours: `${workingHours.start}:00 - ${workingHours.end}:00`,
      minimumNotice: "60 minutes"
    };

  } catch (error) {
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

export const createMeetBookingForGuestService = async (
  createMeetingDto: CreateMeetingDto
) => {
  const { eventId, guestEmail, guestName, additionalInfo } = createMeetingDto;
  const startTime = new Date(createMeetingDto.startTime);
  const endTime = new Date(createMeetingDto.endTime);

  const eventRepository = AppDataSource.getRepository(Event);
  const integrationRepository = AppDataSource.getRepository(Integration);
  const meetingRepository = AppDataSource.getRepository(Meeting);

  const event = await eventRepository.findOne({
    where: { id: eventId, isPrivate: false },
    relations: ["user"],
  });

  if (!event) throw new NotFoundException("Event not found");

  if (!Object.values(EventLocationEnumType).includes(event.locationType)) {
    throw new BadRequestException("Invalid location type");
  }

  const meetIntegration = await integrationRepository.findOne({
    where: {
      user: { id: event.user.id },
      app_type: IntegrationAppTypeEnum[event.locationType],
    },
  });

  if (!meetIntegration)
    throw new BadRequestException("No video conferencing integration found");

  let meetLink: string = "";
  let calendarEventId: string = "";
  let calendarAppType: string = "";

  if (event.locationType === EventLocationEnumType.GOOGLE_MEET_AND_CALENDAR) {
    const { calendarType, calendar } = await getCalendarClient(
      meetIntegration.app_type,
      meetIntegration.access_token,
      meetIntegration.refresh_token,
      meetIntegration.expiry_date
    );
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

    meetLink = response.data.hangoutLink!;
    calendarEventId = response.data.id!;
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

export const cancelMeetingService = async (meetingId: string) => {
  const meetingRepository = AppDataSource.getRepository(Meeting);
  const integrationRepository = AppDataSource.getRepository(Integration);

  const meeting = await meetingRepository.findOne({
    where: { id: meetingId },
    relations: ["event", "event.user"],
  });
  if (!meeting) throw new NotFoundException("Meeting not found");

  try {
    const calendarIntegration = await integrationRepository.findOne({
      where: {
        app_type:
          IntegrationAppTypeEnum[
            meeting.calendarAppType as keyof typeof IntegrationAppTypeEnum
          ],
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
      const { calendar, calendarType } = await getCalendarClient(
        calendarIntegration.app_type,
        calendarIntegration.access_token,
        calendarIntegration.refresh_token,
        calendarIntegration.expiry_date
      );
      switch (calendarType) {
        case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
          await calendar.events.delete({
            calendarId: "primary",
            eventId: meeting.calendarEventId,
          });
          break;
        default:
          throw new BadRequestException(
            `Unsupported calendar provider: ${calendarType}`
          );
      }
    }
  } catch (error) {
    throw new BadRequestException("Failed to delete event from calendar");
  }

  meeting.status = MeetingStatus.CANCELLED;
  await meetingRepository.save(meeting);
  return { success: true };
};

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
