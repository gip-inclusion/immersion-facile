/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE outbox_failures
    SET subscription_id = 'NotifyAllActorsThatConventionIsRejected'
    WHERE subscription_id = 'NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected';
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE outbox_failures
    SET subscription_id = 'NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected'
    WHERE subscription_id = 'NotifyAllActorsThatConventionIsRejected';
    `);
}
