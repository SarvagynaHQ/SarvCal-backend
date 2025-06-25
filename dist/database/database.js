"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
require("reflect-metadata");
const database_config_1 = require("../config/database.config");
const initializeDatabase = async () => {
    try {
        await database_config_1.AppDataSource.initialize();
        console.log("Database connected successfully");
    }
    catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};
exports.initializeDatabase = initializeDatabase;
