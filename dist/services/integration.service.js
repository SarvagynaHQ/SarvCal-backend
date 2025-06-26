"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGoogleCalendarIntegrationForEventService = exports.validateGoogleToken = exports.createIntegrationService = exports.connectAppService = exports.checkIntegrationService = exports.getUserIntegrationsService = void 0;
const database_config_1 = require("../config/database.config");
const integration_entity_1 = require("../database/entities/integration.entity");
const app_error_1 = require("../utils/app-error");
const oauth_config_1 = require("../config/oauth.config");
const helper_1 = require("../utils/helper");
const event_entity_1 = require("../database/entities/event.entity");
const app_error_2 = require("../utils/app-error");
const appTypeToProviderMap = {
    [integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]: integration_entity_1.IntegrationProviderEnum.GOOGLE,
    [integration_entity_1.IntegrationAppTypeEnum.ZOOM_MEETING]: integration_entity_1.IntegrationProviderEnum.ZOOM,
    [integration_entity_1.IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: integration_entity_1.IntegrationProviderEnum.MICROSOFT,
};
const appTypeToCategoryMap = {
    [integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]: integration_entity_1.IntegrationCategoryEnum.CALENDAR_AND_VIDEO_CONFERENCING,
    [integration_entity_1.IntegrationAppTypeEnum.ZOOM_MEETING]: integration_entity_1.IntegrationCategoryEnum.VIDEO_CONFERENCING,
    [integration_entity_1.IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: integration_entity_1.IntegrationCategoryEnum.CALENDAR,
};
const appTypeToTitleMap = {
    [integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR]: "Google Meet & Calendar",
    [integration_entity_1.IntegrationAppTypeEnum.ZOOM_MEETING]: "Zoom",
    [integration_entity_1.IntegrationAppTypeEnum.OUTLOOK_CALENDAR]: "Outlook Calendar",
};
const getUserIntegrationsService = async (userId) => {
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    const userIntegrations = await integrationRepository.find({
        where: { user: { id: userId } },
    });
    const connectedMap = new Map(userIntegrations.map((integration) => [integration.app_type, true]));
    return Object.values(integration_entity_1.IntegrationAppTypeEnum).flatMap((appType) => {
        return {
            provider: appTypeToProviderMap[appType],
            title: appTypeToTitleMap[appType],
            app_type: appType,
            category: appTypeToCategoryMap[appType],
            isConnected: connectedMap.has(appType) || false,
        };
    });
};
exports.getUserIntegrationsService = getUserIntegrationsService;
const checkIntegrationService = async (userId, appType) => {
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    const integration = await integrationRepository.findOne({
        where: { user: { id: userId }, app_type: appType },
    });
    if (!integration) {
        return false;
    }
    return true;
};
exports.checkIntegrationService = checkIntegrationService;
const connectAppService = async (userId, appType) => {
    const state = (0, helper_1.encodeState)({ userId, appType });
    let authUrl;
    switch (appType) {
        case integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR:
            authUrl = oauth_config_1.googleOAuth2Client.generateAuthUrl({
                access_type: "offline",
                scope: ["https://www.googleapis.com/auth/calendar.events"],
                prompt: "consent",
                state,
            });
            break;
        default:
            throw new app_error_1.BadRequestException("Unsupported app type");
    }
    return { url: authUrl };
};
exports.connectAppService = connectAppService;
const createIntegrationService = async (data) => {
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    const existingIntegration = await integrationRepository.findOne({
        where: {
            userId: data.userId,
            app_type: data.app_type,
        },
    });
    if (existingIntegration) {
        throw new app_error_1.BadRequestException(`${data.app_type} already connected`);
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
exports.createIntegrationService = createIntegrationService;
const validateGoogleToken = async (accessToken, refreshToken, expiryDate) => {
    if (expiryDate === null || Date.now() >= expiryDate) {
        oauth_config_1.googleOAuth2Client.setCredentials({
            refresh_token: refreshToken,
        });
        const { credentials } = await oauth_config_1.googleOAuth2Client.refreshAccessToken();
        return credentials.access_token;
    }
    return accessToken;
};
exports.validateGoogleToken = validateGoogleToken;
const checkGoogleCalendarIntegrationForEventService = async (eventId) => {
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    const integrationRepository = database_config_1.AppDataSource.getRepository(integration_entity_1.Integration);
    // First, find the event and get the user ID
    const event = await eventRepository.findOne({
        where: { id: eventId },
        relations: ["user"]
    });
    if (!event) {
        throw new app_error_2.NotFoundException("Event not found");
    }
    // Check if the event owner has Google Calendar integration
    const integration = await integrationRepository.findOne({
        where: {
            user: { id: event.user.id },
            app_type: integration_entity_1.IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
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
            provider: integration.provider,
            app_type: integration.app_type,
            category: integration.category,
            connectedAt: integration.createdAt
        } : null
    };
};
exports.checkGoogleCalendarIntegrationForEventService = checkGoogleCalendarIntegrationForEventService;
