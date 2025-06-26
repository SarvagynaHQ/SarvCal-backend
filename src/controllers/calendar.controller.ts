import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";
import { HTTPSTATUS } from "../config/http.config";
import { getGoogleCalendarConflictsService } from "../services/calendar.service";

export const getGoogleCalendarConflictsController = asyncHandler(
  async (req: Request, res: Response) => {
    const { eventId } = req.params;
    const { date } = req.query;

    if (!eventId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "eventId is required",
      });
    }

    if (!date || typeof date !== "string") {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "date is required and must be in YYYY-MM-DD format",
      });
    }

    // Validate UUID format for eventId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid eventId format. Must be a valid UUID.",
      });
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: "Invalid date format. Must be YYYY-MM-DD.",
      });
    }

    const conflicts = await getGoogleCalendarConflictsService(eventId, date);

    return res.status(HTTPSTATUS.OK).json({
      message: "Calendar conflicts retrieved successfully",
      ...conflicts,
    });
  }
);
