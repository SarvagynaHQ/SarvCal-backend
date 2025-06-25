"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNameAndSlugDTO = exports.UserNameDTO = exports.EventIdDTO = exports.CreateEventDto = void 0;
const class_validator_1 = require("class-validator");
const event_entity_1 = require("../entities/event.entity");
class CreateEventDto {
}
exports.CreateEventDto = CreateEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateEventDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(event_entity_1.EventLocationEnumType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateEventDto.prototype, "locationType", void 0);
class EventIdDTO {
}
exports.EventIdDTO = EventIdDTO;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: "Invaild uuid" }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EventIdDTO.prototype, "eventId", void 0);
class UserNameDTO {
}
exports.UserNameDTO = UserNameDTO;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserNameDTO.prototype, "username", void 0);
class UserNameAndSlugDTO {
}
exports.UserNameAndSlugDTO = UserNameAndSlugDTO;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserNameAndSlugDTO.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserNameAndSlugDTO.prototype, "slug", void 0);
