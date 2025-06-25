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
exports.Integration = exports.IntegrationCategoryEnum = exports.IntegrationAppTypeEnum = exports.IntegrationProviderEnum = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var IntegrationProviderEnum;
(function (IntegrationProviderEnum) {
    IntegrationProviderEnum["GOOGLE"] = "GOOGLE";
    IntegrationProviderEnum["ZOOM"] = "ZOOM";
    IntegrationProviderEnum["MICROSOFT"] = "MICROSOFT";
})(IntegrationProviderEnum || (exports.IntegrationProviderEnum = IntegrationProviderEnum = {}));
var IntegrationAppTypeEnum;
(function (IntegrationAppTypeEnum) {
    IntegrationAppTypeEnum["GOOGLE_MEET_AND_CALENDAR"] = "GOOGLE_MEET_AND_CALENDAR";
    IntegrationAppTypeEnum["ZOOM_MEETING"] = "ZOOM_MEETING";
    IntegrationAppTypeEnum["OUTLOOK_CALENDAR"] = "OUTLOOK_CALENDAR";
})(IntegrationAppTypeEnum || (exports.IntegrationAppTypeEnum = IntegrationAppTypeEnum = {}));
var IntegrationCategoryEnum;
(function (IntegrationCategoryEnum) {
    IntegrationCategoryEnum["CALENDAR_AND_VIDEO_CONFERENCING"] = "CALENDAR_AND_VIDEO_CONFERENCING";
    IntegrationCategoryEnum["VIDEO_CONFERENCING"] = "VIDEO_CONFERENCING";
    IntegrationCategoryEnum["CALENDAR"] = "CALENDAR";
})(IntegrationCategoryEnum || (exports.IntegrationCategoryEnum = IntegrationCategoryEnum = {}));
let Integration = class Integration {
};
exports.Integration = Integration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Integration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: IntegrationProviderEnum }),
    __metadata("design:type", String)
], Integration.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: IntegrationCategoryEnum }),
    __metadata("design:type", String)
], Integration.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: IntegrationAppTypeEnum }),
    __metadata("design:type", String)
], Integration.prototype, "app_type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Integration.prototype, "access_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Integration.prototype, "refresh_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "bigint", nullable: true }),
    __metadata("design:type", Object)
], Integration.prototype, "expiry_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json" }),
    __metadata("design:type", Object)
], Integration.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Integration.prototype, "isConnected", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Integration.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.integrations),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", user_entity_1.User)
], Integration.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Integration.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Integration.prototype, "updatedAt", void 0);
exports.Integration = Integration = __decorate([
    (0, typeorm_1.Entity)({ name: "integrations" })
], Integration);
