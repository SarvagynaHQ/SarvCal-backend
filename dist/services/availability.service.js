"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailabilityForPublicEventService = exports.updateAvailabilityService = exports.getUserAvailabilityService = void 0;
const database_config_1 = require("../config/database.config");
const user_entity_1 = require("../database/entities/user.entity");
const app_error_1 = require("../utils/app-error");
const availability_entity_1 = require("../database/entities/availability.entity");
const day_availability_1 = require("../database/entities/day-availability");
const event_entity_1 = require("../database/entities/event.entity");
const date_fns_1 = require("date-fns");
const getUserAvailabilityService = async (userId) => {
    const userRepository = database_config_1.AppDataSource.getRepository(user_entity_1.User);
    const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["availability", "availability.days"],
    });
    if (!user || !user.availability) {
        throw new app_error_1.NotFoundException("User not found or availbility");
    }
    const availabilityData = {
        timeGap: user.availability.timeGap,
        days: [],
    };
    user.availability.days.forEach((dayAvailability) => {
        availabilityData.days.push({
            day: dayAvailability.day,
            startTime: dayAvailability.startTime.toISOString().slice(11, 16),
            endTime: dayAvailability.endTime.toISOString().slice(11, 16),
            isAvailable: dayAvailability.isAvailable,
        });
    });
    return availabilityData;
};
exports.getUserAvailabilityService = getUserAvailabilityService;
const updateAvailabilityService = async (userId, data) => {
    const userRepository = database_config_1.AppDataSource.getRepository(user_entity_1.User);
    const availabilityRepository = database_config_1.AppDataSource.getRepository(availability_entity_1.Availability);
    const user = await userRepository.findOne({
        where: { id: userId },
        relations: ["availability", "availability.days"],
    });
    if (!user)
        throw new app_error_1.NotFoundException("User not found");
    const dayAvailabilityData = data.days.map(({ day, isAvailable, startTime, endTime }) => {
        const baseDate = new Date().toISOString().split("T")[0];
        return {
            day: day.toUpperCase(),
            startTime: new Date(`${baseDate}T${startTime}:00Z`),
            endTime: new Date(`${baseDate}T${endTime}:00Z`),
            isAvailable,
        };
    });
    if (user.availability) {
        await availabilityRepository.save({
            id: user.availability.id,
            timeGap: data.timeGap,
            days: dayAvailabilityData.map((day) => ({
                ...day,
                availability: { id: user.availability.id },
            })),
        });
    }
    return { sucess: true };
};
exports.updateAvailabilityService = updateAvailabilityService;
const getAvailabilityForPublicEventService = async (eventId) => {
    const eventRepository = database_config_1.AppDataSource.getRepository(event_entity_1.Event);
    const event = await eventRepository.findOne({
        where: { id: eventId, isPrivate: false },
        relations: [
            "user",
            "user.availability",
            "user.availability.days",
            "user.meetings",
        ],
    });
    if (!event || !event.user.availability)
        return [];
    const { availability, meetings } = event.user;
    const daysOfWeek = Object.values(day_availability_1.DayOfWeekEnum);
    const availableDays = [];
    for (const dayOfWeek of daysOfWeek) {
        const nextDate = getNextDateForDay(dayOfWeek);
        //console.log(nextDate, dayOfWeek, "nextDate");
        const dayAvailability = availability.days.find((d) => d.day === dayOfWeek);
        if (dayAvailability) {
            const slots = dayAvailability.isAvailable
                ? generateAvailableTimeSlots(dayAvailability.startTime, dayAvailability.endTime, event.duration, meetings, (0, date_fns_1.format)(nextDate, "yyyy-MM-dd"), availability.timeGap)
                : [];
            availableDays.push({
                day: dayOfWeek,
                slots,
                isAvailable: dayAvailability.isAvailable,
            });
        }
    }
    return availableDays;
};
exports.getAvailabilityForPublicEventService = getAvailabilityForPublicEventService;
function getNextDateForDay(dayOfWeek) {
    const days = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
    ];
    const today = new Date();
    const todayDay = today.getDay();
    const targetDay = days.indexOf(dayOfWeek);
    //todayDay = 1// Monday
    //dayOfWeek  = 1 Monday
    //(1 - 1) = 0
    //-3 + 7 = 4
    // 4 % 7 = 4
    //result: Monday is in 0
    const daysUntilTarget = (targetDay - todayDay + 7) % 7;
    return (0, date_fns_1.addDays)(today, daysUntilTarget);
}
function generateAvailableTimeSlots(startTime, endTime, duration, meetings, dateStr, timeGap = 30) {
    const slots = [];
    let slotStartTime = (0, date_fns_1.parseISO)(`${dateStr}T${startTime.toISOString().slice(11, 16)}`);
    let slotEndTime = (0, date_fns_1.parseISO)(`${dateStr}T${endTime.toISOString().slice(11, 16)}`);
    const now = new Date();
    const isToday = (0, date_fns_1.format)(now, "yyyy-MM-dd") === dateStr;
    while (slotStartTime < slotEndTime) {
        if (!isToday || slotStartTime >= now) {
            const slotEnd = new Date(slotStartTime.getTime() + duration * 60000);
            if (isSlotAvailable(slotStartTime, slotEnd, meetings)) {
                slots.push((0, date_fns_1.format)(slotStartTime, "HH:mm"));
            }
        }
        slotStartTime = (0, date_fns_1.addMinutes)(slotStartTime, timeGap);
    }
    return slots;
}
function isSlotAvailable(slotStart, slotEnd, meetings) {
    for (const meeting of meetings) {
        if (slotStart < meeting.endTime && slotEnd > meeting.startTime) {
            return false;
        }
    }
    return true;
}
