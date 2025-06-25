"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginService = exports.registerService = void 0;
const uuid_1 = require("uuid");
const database_config_1 = require("../config/database.config");
const user_entity_1 = require("../database/entities/user.entity");
const app_error_1 = require("../utils/app-error");
const availability_entity_1 = require("../database/entities/availability.entity");
const day_availability_1 = require("../database/entities/day-availability");
const jwt_1 = require("../utils/jwt");
const registerService = async (registerDto) => {
    const userRepository = database_config_1.AppDataSource.getRepository(user_entity_1.User);
    const availabilityRepository = database_config_1.AppDataSource.getRepository(availability_entity_1.Availability);
    const dayAvailabilityRepository = database_config_1.AppDataSource.getRepository(day_availability_1.DayAvailability);
    const existingUser = await userRepository.findOne({
        where: { email: registerDto.email },
    });
    if (existingUser) {
        throw new app_error_1.BadRequestException("User already exists");
    }
    const username = await generateUsername(registerDto.name);
    const user = userRepository.create({
        ...registerDto,
        username,
    });
    const availability = availabilityRepository.create({
        timeGap: 30,
        days: Object.values(day_availability_1.DayOfWeekEnum).map((day) => {
            return dayAvailabilityRepository.create({
                day: day,
                startTime: new Date(`2025-03-01T09:00:00Z`), //9:00
                endTime: new Date(`2025-03-01T17:00:00Z`), //5:00pm
                isAvailable: day !== day_availability_1.DayOfWeekEnum.SUNDAY && day !== day_availability_1.DayOfWeekEnum.SATURDAY,
            });
        }),
    });
    user.availability = availability;
    await userRepository.save(user);
    return { user: user.omitPassword() };
};
exports.registerService = registerService;
const loginService = async (loginDto) => {
    const userRepository = database_config_1.AppDataSource.getRepository(user_entity_1.User);
    const user = await userRepository.findOne({
        where: { email: loginDto.email },
    });
    if (!user) {
        throw new app_error_1.NotFoundException("User not found");
    }
    const isPasswordValid = await user.comparePassword(loginDto.password);
    if (!isPasswordValid) {
        throw new app_error_1.UnauthorizedException("Invalid email/password");
    }
    const { token, expiresAt } = (0, jwt_1.signJwtToken)({ userId: user.id });
    return {
        user: user.omitPassword(),
        accessToken: token,
        expiresAt,
    };
};
exports.loginService = loginService;
async function generateUsername(name) {
    const cleanName = name.replace(/\s+/g, "").toLowerCase();
    const baseUsername = cleanName;
    const uuidSuffix = (0, uuid_1.v4)().replace(/\s+/g, "").slice(0, 4);
    const userRepository = database_config_1.AppDataSource.getRepository(user_entity_1.User);
    let username = `${baseUsername}${uuidSuffix}`;
    let existingUser = await userRepository.findOne({
        where: { username },
    });
    while (existingUser) {
        username = `${baseUsername}${(0, uuid_1.v4)().replace(/\s+/g, "").slice(0, 4)}`;
        existingUser = await userRepository.findOne({
            where: { username },
        });
    }
    return username;
}
