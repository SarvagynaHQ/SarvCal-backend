"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEventService = exports.getPublicEventByUsernameAndSlugService = exports.getPublicEventsByUsernameService = exports.toggleEventPrivacyService = exports.getUserEventsService = exports.createEventService = void 0;
const database_config_1 = require("../config/database.config");
const event_entity_1 = require("../database/entities/event.entity");
const user_entity_1 = require("../database/entities/user.entity");
const app_error_1 = require("../utils/app-error");
const helper_1 = require("../utils/helper");
const createEventService = async (userId, createEventDto) => {
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    if (!Object.values(event_entity_1.EventLocationEnumType)?.includes(createEventDto.locationType)) {
        throw new app_error_1.BadRequestException("Invalid location type");
    }
    const slug = (0, helper_1.slugify)(createEventDto.title);
    const event = eventRepository.create({
        ...createEventDto,
        slug,
        user: { id: userId },
    });
    await eventRepository.save(event);
    return event;
};
exports.createEventService = createEventService;
const getUserEventsService = async (userId) => {
    const userRepository = database_config_1.AppDataSource.getRepository(user_entity_1.User);
    const user = await userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.events", "event")
        .loadRelationCountAndMap("event._count.meetings", "event.meetings")
        .where("user.id = :userId", { userId })
        .orderBy("event.createdAt", "DESC")
        .getOne();
    if (!user) {
        throw new app_error_1.NotFoundException("User not found");
    }
    return {
        events: user.events,
        username: user.username,
    };
};
exports.getUserEventsService = getUserEventsService;
const toggleEventPrivacyService = async (userId, eventId) => {
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    const event = await eventRepository.findOne({
        where: { id: eventId, user: { id: userId } },
    });
    if (!event) {
        throw new app_error_1.NotFoundException("Event not found");
    }
    event.isPrivate = !event.isPrivate;
    await eventRepository.save(event);
    return event;
};
exports.toggleEventPrivacyService = toggleEventPrivacyService;
// Publuc Events
const getPublicEventsByUsernameService = async (username) => {
    const userRepository = database_config_1.AppDataSource.getRepository(user_entity_1.User);
    const user = await userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect("user.events", "event", "event.isPrivate = :isPrivate", {
        isPrivate: false,
    })
        .where("user.username = :username", { username })
        .select(["user.id", "user.name", "user.imageUrl"])
        .addSelect([
        "event.id",
        "event.title",
        "event.description",
        "event.slug",
        "event.duration",
        "event.locationType",
    ])
        .orderBy("event.createdAt", "DESC")
        .getOne();
    if (!user) {
        throw new app_error_1.NotFoundException("User not found");
    }
    return {
        user: {
            name: user.name,
            username: username,
            imageUrl: user.imageUrl,
        },
        events: user.events,
    };
};
exports.getPublicEventsByUsernameService = getPublicEventsByUsernameService;
const getPublicEventByUsernameAndSlugService = async (userNameAndSlugDto) => {
    const { username, slug } = userNameAndSlugDto;
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    const event = await eventRepository
        .createQueryBuilder("event")
        .leftJoinAndSelect("event.user", "user")
        .where("user.username = :username", { username })
        .andWhere("event.slug = :slug", { slug })
        .andWhere("event.isPrivate = :isPrivate", { isPrivate: false })
        .select([
        "event.id",
        "event.title",
        "event.description",
        "event.slug",
        "event.duration",
        "event.locationType",
    ])
        .addSelect(["user.id", "user.name", "user.imageUrl"])
        .getOne();
    return event;
};
exports.getPublicEventByUsernameAndSlugService = getPublicEventByUsernameAndSlugService;
const deleteEventService = async (userId, eventId) => {
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    const event = await eventRepository.findOne({
        where: { id: eventId, user: { id: userId } },
    });
    if (!event) {
        throw new app_error_1.NotFoundException("Event not found");
    }
    await eventRepository.remove(event);
    return { success: true };
};
exports.deleteEventService = deleteEventService;
