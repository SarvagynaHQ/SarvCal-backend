"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandlerAndValidation = asyncHandlerAndValidation;
exports.withValidation = withValidation;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const http_config_1 = require("../config/http.config");
const error_code_enum_1 = require("../enums/error-code.enum");
const asyncHandler_middeware_1 = require("./asyncHandler.middeware");
function asyncHandlerAndValidation(dto, source = "body", handler) {
    return (0, asyncHandler_middeware_1.asyncHandler)(withValidation(dto, source)(handler));
}
function withValidation(DtoClass, source = "body") {
    return function (handler) {
        return async (req, res, next) => {
            try {
                const dtoInstance = (0, class_transformer_1.plainToInstance)(DtoClass, req[source]);
                const errors = await (0, class_validator_1.validate)(dtoInstance);
                if (errors.length > 0) {
                    return formatValidationError(res, errors);
                }
                return handler(req, res, dtoInstance);
            }
            catch (error) {
                next(error);
            }
        };
    };
}
function formatValidationError(res, errors) {
    return res.status(http_config_1.HTTPSTATUS.BAD_REQUEST).json({
        message: "Validation failed",
        errorCode: error_code_enum_1.ErrorCodeEnum.VALIDATION_ERROR,
        errors: errors.map((err) => ({
            field: err.property,
            message: err.constraints,
        })),
    });
}
