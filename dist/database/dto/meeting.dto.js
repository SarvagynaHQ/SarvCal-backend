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
exports.AvailableSlotsDTO = exports.EventIdDTO = exports.MeetingIdDTO = exports.CreateMeetingDto = void 0;
const class_validator_1 = require("class-validator");
class CreateMeetingDto {
}
exports.CreateMeetingDto = CreateMeetingDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "guestName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "guestEmail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "additionalInfo", void 0);
class MeetingIdDTO {
}
exports.MeetingIdDTO = MeetingIdDTO;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: "Invaild uuid" }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MeetingIdDTO.prototype, "meetingId", void 0);
class EventIdDTO {
}
exports.EventIdDTO = EventIdDTO;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: "Invalid event ID" }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EventIdDTO.prototype, "eventId", void 0);
class AvailableSlotsDTO {
}
exports.AvailableSlotsDTO = AvailableSlotsDTO;
__decorate([
    (0, class_validator_1.IsUUID)(4, { message: "Invalid event ID" }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AvailableSlotsDTO.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AvailableSlotsDTO.prototype, "date", void 0);
