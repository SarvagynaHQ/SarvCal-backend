"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEventTable1742035317807 = void 0;
class UpdateEventTable1742035317807 {
    constructor() {
        this.name = 'UpdateEventTable1742035317807';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meetings" ALTER COLUMN "status" DROP DEFAULT`);
    }
}
exports.UpdateEventTable1742035317807 = UpdateEventTable1742035317807;
