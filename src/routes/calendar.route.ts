import { Router } from "express";
import { getGoogleCalendarConflictsController } from "../controllers/calendar.controller";

const calendarRoutes = Router();

// Route to get Google Calendar conflicts for a specific event and date
calendarRoutes.get("/google/conflicts/:eventId", getGoogleCalendarConflictsController);

export default calendarRoutes;
