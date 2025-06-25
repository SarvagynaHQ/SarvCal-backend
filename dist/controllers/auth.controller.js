"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = exports.registerController = void 0;
const http_config_1 = require("../config/http.config");
const auth_dto_1 = require("../database/dto/auth.dto");
const withValidation_middleware_1 = require("../middlewares/withValidation.middleware");
const auth_service_1 = require("../services/auth.service");
//withValidation(RegisterDto, "body")();
exports.registerController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(auth_dto_1.RegisterDto, "body", async (req, res, registerDTO) => {
    const { user } = await (0, auth_service_1.registerService)(registerDTO);
    return res.status(http_config_1.HTTPSTATUS.CREATED).json({
        message: "User created successfully",
        user,
    });
});
exports.loginController = (0, withValidation_middleware_1.asyncHandlerAndValidation)(auth_dto_1.LoginDto, "body", async (req, res, loginDto) => {
    const { user, accessToken, expiresAt } = await (0, auth_service_1.loginService)(loginDto);
    return res.status(http_config_1.HTTPSTATUS.CREATED).json({
        message: "User logged in successfully",
        user,
        accessToken,
        expiresAt,
    });
});
