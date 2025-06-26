"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("./config/passport.config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app_config_1 = require("./config/app.config");
const http_config_1 = require("./config/http.config");
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const asyncHandler_middeware_1 = require("./middlewares/asyncHandler.middeware");
const database_1 = require("./database/database");
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const passport_1 = __importDefault(require("passport"));
const event_route_1 = __importDefault(require("./routes/event.route"));
const availability_route_1 = __importDefault(require("./routes/availability.route"));
const integration_route_1 = __importDefault(require("./routes/integration.route"));
const meeting_route_1 = __importDefault(require("./routes/meeting.route"));
const calendar_route_1 = __importDefault(require("./routes/calendar.route"));
const app = (0, express_1.default)();
const BASE_PATH = app_config_1.config.BASE_PATH;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(passport_1.default.initialize());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            app_config_1.config.FRONTEND_ORIGIN,
            app_config_1.config.FRONTEND_ORIGIN.replace(/\/$/, ""), // Remove trailing slash
            app_config_1.config.FRONTEND_ORIGIN + (app_config_1.config.FRONTEND_ORIGIN.endsWith("/") ? "" : "/"), // Add trailing slash
            "http://localhost:3000",
            "http://localhost:5173",
            "https://sarvcal.vercel.app",
            "https://sarvcal.vercel.app/"
        ];
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.get("/", (0, asyncHandler_middeware_1.asyncHandler)(async (req, res, next) => {
    // Updated with booked slots endpoint
    res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Hello we are Sarvagyna LLC",
    });
}));
app.use(`${BASE_PATH}/auth`, auth_route_1.default);
app.use(`${BASE_PATH}/event`, event_route_1.default);
app.use(`${BASE_PATH}/availability`, availability_route_1.default);
app.use(`${BASE_PATH}/integration`, integration_route_1.default);
app.use(`${BASE_PATH}/meeting`, meeting_route_1.default);
app.use(`${BASE_PATH}/calendar`, calendar_route_1.default);
app.use(errorHandler_middleware_1.errorHandler);
app.listen(app_config_1.config.PORT, async () => {
    await (0, database_1.initializeDatabase)();
    console.log(`Server listening on port ${app_config_1.config.PORT} in ${app_config_1.config.NODE_ENV}`);
});
