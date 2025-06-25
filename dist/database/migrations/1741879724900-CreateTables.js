"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTables1741879724900 = void 0;
class CreateTables1741879724900 {
    constructor() {
        this.name = 'CreateTables1741879724900';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "isPrivate"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "isPrivate" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "isPrivate"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "isPrivate" character varying NOT NULL DEFAULT false`);
    }
}
exports.CreateTables1741879724900 = CreateTables1741879724900;
