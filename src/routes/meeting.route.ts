import { Router } from "express";
import {
  cancelMeetingController,
  createMeetBookingForGuestController,
  getUserMeetingsController,
  getBookedSlotsController,
  getAvailableSlotsController,
  getAllBookedSlotsController,
  rescheduleMeetingController,
  getMeetingDetailsController,
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

meetingRoutes.get("/public/available-slots", getAvailableSlotsController);

meetingRoutes.get("/public/all-booked-slots", getAllBookedSlotsController);

meetingRoutes.put(
  "/cancel/:meetingId",
  passportAuthenticateJwt,
  cancelMeetingController
);

meetingRoutes.put("/reschedule", rescheduleMeetingController);

meetingRoutes.get("/:meetingId", getMeetingDetailsController);

export default meetingRoutes;
