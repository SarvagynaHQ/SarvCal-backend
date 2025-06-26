import { title } from "process";
import { AppDataSource } from "../config/database.config";
import {
  Integration,
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum,
  IntegrationProviderEnum,
} from "../database/entities/integration.entity";
import { BadRequestException } from "../utils/app-error";
import { googleOAuth2Client } from "../config/oauth.config";
import { encodeState } from "../utils/helper";
import { Event } from "../database/entities/event.entity";
import { NotFoundException } from "../utils/app-error";

const appTypeToProviderMap: Record<
  IntegrationAppTypeEnum,
  IntegrationProviderEnum
> = {
  [IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]:
    IntegrationProviderEnum.GOOGLE,
  [IntegrationAppTypeEnum.ZOOM_MEETING]: IntegrationProviderEnum.ZOOM,
  [IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: IntegrationProviderEnum.MICROSOFT,
};

const appTypeToCategoryMap: Record<
  IntegrationAppTypeEnum,
  IntegrationCategoryEnum
> = {
  [IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]:
    IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
  [IntegrationAppTypeEnum.ZOOM_MEETING]:
    IntegrationCategoryEnum.VIDEO_CONFERENCING,
  [IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: IntegrationCategoryEnum.CALENDAR,
};

const appTypeToTitleMap: Record<IntegrationAppTypeEnum, string> = {
  [IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]: "Google Meet & Calendar",
  [IntegrationAppTypeEnum.ZOOM_MEETING]: "Zoom",
  [IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: "Outlook Calendar",
};

export const getUserIntegrationsService = async (userId: string) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  const userIntegrations = await integrationRepository.find({
    where: { user: { id: userId } },
  });

  const connectedMap = new Map(
    userIntegrations.map((integration) => [integration.app_type, true])
  );

  return Object.values(IntegrationAppTypeEnum).flatMap((appType) => {
    return {
      provider: appTypeToProviderMap[appType],
      title: appTypeToTitleMap[appType],
      app_type: appType,
      category: appTypeToCategoryMap[appType],
      isConnected: connectedMap.has(appType) || false,
    };
  });
};

export const checkIntegrationService = async (
  userId: string,
  appType: IntegrationAppTypeEnum
) => {
  const integrationRepository = AppDataSource.getRepository(Integration);

  const integration = await integrationRepository.findOne({
    where: { user: { id: userId }, app_type: appType },
  });

  if (!integration) {
    return false;
  }

  return true;
};

export const connectAppService = async (
  userId: string,
  appType: IntegrationAppTypeEnum
) => {
  const state = encodeState({ userId, appType });

  let authUrl: string;

  switch (appType) {
    case IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
      authUrl = googleOAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/calendar.events"],
        prompt: "consent",
        state,
      });
      break;
    default:
      throw new BadRequestException("Unsupported app type");
  }

  return { url: authUrl };
};

export const createIntegrationService = async (data: {
  userId: string;
  provider: IntegrationProviderEnum;
  category: IntegrationCategoryEnum;
  app_type: IntegrationAppTypeEnum;
  access_token: string;
  refresh_token?: string;
  expiry_date: number | null;
  metadata: any;
}) => {
  const integrationRepository = AppDataSource.getRepository(Integration);
  const existingIntegration = await integrationRepository.findOne({
    where: {
      userId: data.userId,
      app_type: data.app_type,
    },
  });

  if (existingIntegration) {
    throw new BadRequestException(`${data.app_type} already connected`);
  }

  const integration = integrationRepository.create({
    provider: data.provider,
    category: data.category,
    app_type: data.app_type,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: data.expiry_date,
    metadata: data.metadata,
    userId: data.userId,
    isConnected: true,
  });

  await integrationRepository.save(integration);

  return integration;
};

export const validateGoogleToken = async (
  accessToken: string,
  refreshToken: string,
  expiryDate: number | null
) => {
  if (expiryDate === null || Date.now() >= expiryDate) {
    googleOAuth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    const { credentials } = await googleOAuth2Client.refreshAccessToken();
    return credentials.access_token;
  }

  return accessToken;
};

export const checkGoogleCalendarIntegrationForEventService = async (eventId: string) => {
  const eventRepository = AppDataSource.getRepository(Event);
  const integrationRepository = AppDataSource.getRepository(Integration);

  // First, find the event and get the user ID
  const event = await eventRepository.findOne({
    where: { id: eventId },
    relations: ["user"]
  });

  if (!event) {
    throw new NotFoundException("Event not found");
  }

  // Check if the event owner has Google Calendar integration
  const integration = await integrationRepository.findOne({
    where: {
      user: { id: event.user.id },
      app_type: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
    },
  });

  const isConnected = !!integration;
  
  return {
    isConnected,
    eventId,
    eventTitle: event.title,
    eventOwner: {
      id: event.user.id,
      email: event.user.email
    },
    integration: isConnected ? {
      provider: integration!.provider,
      app_type: integration!.app_type,
      category: integration!.category,
      connectedAt: integration!.createdAt
    } : null
  };
};
