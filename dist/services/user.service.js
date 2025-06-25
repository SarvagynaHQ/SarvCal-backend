"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByIdUserService = void 0;
const database_config_1 = require("../config/database.config");
const user_entity_1 = require("../database/entities/user.entity");
const findByIdUserService = async (userId) => {
    const userRepository = database_config_1.AppDataSource.getRepository(user_entity_1.User);
    return await userRepository.findOne({ where: { id: userId } });
};
exports.findByIdUserService = findByIdUserService;
