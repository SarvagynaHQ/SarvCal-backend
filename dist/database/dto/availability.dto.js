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
exports.UpdateAvailabilityDto = exports.DayAvailabilityDto = void 0;
const class_validator_1 = require("class-validator");
const day_availability_1 = require("../entities/day-availability");
const class_transformer_1 = require("class-transformer");
class DayAvailabilityDto {
}
exports.DayAvailabilityDto = DayAvailabilityDto;
__decorate([
    (0, class_validator_1.IsEnum)(day_availability_1.DayOfWeekEnum),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DayAvailabilityDto.prototype, "day", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DayAvailabilityDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DayAvailabilityDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Boolean)
], DayAvailabilityDto.prototype, "isAvailable", void 0);
class UpdateAvailabilityDto {
}
exports.UpdateAvailabilityDto = UpdateAvailabilityDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], UpdateAvailabilityDto.prototype, "timeGap", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DayAvailabilityDto),
    __metadata("design:type", Array)
], UpdateAvailabilityDto.prototype, "days", void 0);
