"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = exports.getDatabaseConfig = void 0;
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const typeorm_1 = require("typeorm");
const app_config_1 = require("./app.config");
const getDatabaseConfig = () => {
    const isProduction = app_config_1.config.NODE_ENV === "production";
    const databaseUrl = app_config_1.config.DATABASE_URL;
    return new typeorm_1.DataSource({
        type: "postgres",
        url: databaseUrl,
        entities: [path_1.default.join(__dirname, "../database/entities/*{.ts,.js}")],
        migrations: [path_1.default.join(__dirname, "../database/migrations/*{.ts,.js}")],
        synchronize: !isProduction,
        logging: isProduction ? false : ["error"],
        ssl: isProduction
            ? {
                rejectUnauthorized: true,
            }
            : {
                rejectUnauthorized: false,
            },
    });
};
exports.getDatabaseConfig = getDatabaseConfig;
exports.AppDataSource = (0, exports.getDatabaseConfig)();
