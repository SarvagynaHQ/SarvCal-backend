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
exports.Event = exports.EventLocationEnumType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const meeting_entity_1 = require("./meeting.entity");
var EventLocationEnumType;
(function (EventLocationEnumType) {
    EventLocationEnumType["GOOGLE_MEET_AND_CALENDAR"] = "GOOGLE_MEET_AND_CALENDAR";
    EventLocationEnumType["ZOOM_MEETING"] = "ZOOM_MEETING";
})(EventLocationEnumType || (exports.EventLocationEnumType = EventLocationEnumType = {}));
let Event = class Event {
};
exports.Event = Event;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Event.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Event.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Event.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 30 }),
    __metadata("design:type", Number)
], Event.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: false }),
    __metadata("design:type", String)
], Event.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Event.prototype, "isPrivate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: EventLocationEnumType }),
    __metadata("design:type", String)
], Event.prototype, "locationType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.events),
    __metadata("design:type", user_entity_1.User)
], Event.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => meeting_entity_1.Meeting, (meeting) => meeting.event),
    __metadata("design:type", Array)
], Event.prototype, "meetings", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Event.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Event.prototype, "updatedAt", void 0);
exports.Event = Event = __decorate([
    (0, typeorm_1.Entity)({ name: "events" })
], Event);
