"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMeetingTable1742039170939 = void 0;
class UpdateMeetingTable1742039170939 {
    constructor() {
        this.name = 'UpdateMeetingTable1742039170939';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meetings" ADD "calendarAppType" character varying NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meetings" DROP COLUMN "calendarAppType"`);
    }
}
exports.UpdateMeetingTable1742039170939 = UpdateMeetingTable1742039170939;
