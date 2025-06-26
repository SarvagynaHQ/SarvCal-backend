import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  checkIntegrationController,
  connectAppController,
  getUserIntegrationsController,
  googleOAuthCallbackController,
  checkGoogleCalendarIntegrationController,
} from "../controllers/integration.controller";

const integrationRoutes = Router();

integrationRoutes.get(
  "/all",
  passportAuthenticateJwt,
  getUserIntegrationsController
);

integrationRoutes.get(
  "/check/:appType",
  passportAuthenticateJwt,
  checkIntegrationController
);

integrationRoutes.get(
  "/connect/:appType",
  passportAuthenticateJwt,
  connectAppController
);

integrationRoutes.get("/google/callback", googleOAuthCallbackController);

// New route for checking Google Calendar integration for a specific event
integrationRoutes.get("/google-calendar/check/:eventId", checkGoogleCalendarIntegrationController);

// Test endpoint to verify deployment
integrationRoutes.get("/test", (req, res) => {
  res.json({ message: "Integration routes working", timestamp: new Date().toISOString() });
});

export default integrationRoutes;
