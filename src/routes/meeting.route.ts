import { Router } from "express";
import {
  cancelMeetingController,
  createMeetBookingForGuestController,
  getUserMeetingsController,
  getBookedSlotsController,
} from "../controllers/meeting.controller";
import { passportAuthenticateJwt } from "../config/passport.config";

const meetingRoutes = Router();

meetingRoutes.get(
  "/user/all",
  passportAuthenticateJwt,
  getUserMeetingsController
);

meetingRoutes.post("/public/create", createMeetBookingForGuestController);

meetingRoutes.get("/public/booked-slots/:eventId", getBookedSlotsController);

meetingRoutes.put(
  "/cancel/:meetingId",
  passportAuthenticateJwt,
  cancelMeetingController
);

export default meetingRoutes;
