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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const bcrypt_1 = require("../../utils/bcrypt");
const integration_entity_1 = require("./integration.entity");
const event_entity_1 = require("./event.entity");
const availability_entity_1 = require("./availability.entity");
const meeting_entity_1 = require("./meeting.entity");
let User = class User {
    async hashPassword() {
        if (this.password) {
            this.password = await (0, bcrypt_1.hashValue)(this.password);
        }
    }
    async comparePassword(candidatePassword) {
        return (0, bcrypt_1.compareValue)(candidatePassword, this.password);
    }
    omitPassword() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false, unique: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, nullable: false }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => event_entity_1.Event, (event) => event.user, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], User.prototype, "events", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => integration_entity_1.Integration, (integration) => integration.user, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], User.prototype, "integrations", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => availability_entity_1.Availability, (availability) => availability.user, {
        cascade: true,
    }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", availability_entity_1.Availability)
], User.prototype, "availability", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => meeting_entity_1.Meeting, (meeting) => meeting.user, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], User.prototype, "meetings", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], User.prototype, "hashPassword", null);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)({ name: "users" })
], User);
