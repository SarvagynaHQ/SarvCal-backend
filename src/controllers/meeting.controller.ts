import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import {
  MeetingFilterEnum,
  MeetingFilterEnumType,
} from "../enums/meeting.enum";
import {
  cancelMeetingService,
  createMeetBookingForGuestService,
  getUserMeetingsService,
  getBookedSlotsByEventIdService,
  getAvailableSlotsService,
  getAllBookedSlotsService,
  rescheduleMeetingService
} from "../services/meeting.service";
import { asyncHandlerAndValidation } from "../middlewares/withValidation.middleware";
import { CreateMeetingDto, MeetingIdDTO, EventIdDTO, AvailableSlotsDTO, RescheduleMeetingDto } from "../database/dto/meeting.dto";

export const getUserMeetingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id as string;

    const filter =
      (req.query.filter as MeetingFilterEnumType) || MeetingFilterEnum.UPCOMING;

    const meetings = await getUserMeetingsService(userId, filter);

    return res.status(HTTPSTATUS.OK).json({
      message: "Meetings fetched successfully",
      meetings,
    });
  }
);

// For Public
export const createMeetBookingForGuestController = asyncHandlerAndValidation(
  CreateMeetingDto,
  "body",
  async (req: Request, res: Response, createMeetingDto) => {
    const { meetLink, meeting } = await createMeetBookingForGuestService(
      createMeetingDto
    );
    return res.status(HTTPSTATUS.CREATED).json({
      message: "Meeting scheduled successfully",
      data: {
        meetLink,
        meeting,
      },
    });
  }
);

export const cancelMeetingController = asyncHandlerAndValidation(
  MeetingIdDTO,
  "params",
  async (req: Request, res: Response, meetingIdDto) => {
    await cancelMeetingService(meetingIdDto.meetingId);
    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting cancelled successfully",
    });
  }
);

export const getBookedSlotsController = asyncHandlerAndValidation(
  EventIdDTO,
  "params",
  async (req: Request, res: Response, eventIdDto) => {
    const bookedSlots = await getBookedSlotsByEventIdService(eventIdDto.eventId);
    return res.status(HTTPSTATUS.OK).json({
      message: "Booked slots retrieved successfully",
      bookedSlots,
    });
  }
);

export const getAvailableSlotsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { eventId, date } = req.query;
    
    if (!eventId || !date) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "eventId and date are required query parameters",
      });
    }

    // Validate UUID format for eventId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId as string)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid eventId format. Must be a valid UUID.",
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date as string)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid date format. Use YYYY-MM-DD format.",
      });
    }

    const availability = await getAvailableSlotsService(
      eventId as string, 
      date as string
    );
    return res.status(HTTPSTATUS.OK).json({
      message: "Available slots retrieved successfully",
      data: availability,
    });
  }
);

export const getAllBookedSlotsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { date } = req.query;
    
    if (!date || typeof date !== 'string') {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Date parameter is required in YYYY-MM-DD format'
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const bookedSlots = await getAllBookedSlotsService(date);
    
    return res.status(HTTPSTATUS.OK).json({
      message: 'All booked slots retrieved successfully',
      date,
      bookedSlots
    });
  }
);

export const rescheduleMeetingController = asyncHandlerAndValidation(
  RescheduleMeetingDto,
  "body",
  async (req: Request, res: Response, rescheduleDto) => {
    const meeting = await rescheduleMeetingService(rescheduleDto);
    
    return res.status(HTTPSTATUS.OK).json({
      message: "Meeting rescheduled successfully",
      data: {
        meeting,
        meetLink: meeting.meetLink
      }
    });
  }
);
