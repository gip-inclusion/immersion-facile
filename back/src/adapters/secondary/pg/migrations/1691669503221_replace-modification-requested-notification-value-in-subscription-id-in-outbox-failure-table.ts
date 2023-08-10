/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE outbox_failures
    SET subscription_id = 'NotifyAccurateActorThatConventionNeedsModifications'
    WHERE subscription_id = 'NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification';
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE outbox_failures
    SET subscription_id = 'NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification'
    WHERE subscription_id = 'NotifyAccurateActorThatConventionNeedsModifications';
    `);
}
