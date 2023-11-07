import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE outbox_failures SET subscription_id = 'NotifyNewConventionNeedsReview' WHERE subscription_id = 'NotifyNewApplicationNeedsReview';
    UPDATE outbox_failures SET subscription_id = 'NotifyToAgencyConventionSubmitted' WHERE subscription_id = 'NotifyToAgencyApplicationSubmitted';
    UPDATE outbox_failures SET subscription_id = 'ShareConventionLinkByEmail' WHERE subscription_id = 'ShareApplicationLinkByEmail';
    UPDATE outbox_failures SET subscription_id = 'NotifyAllActorsOfFinalConventionValidation' WHERE subscription_id = 'NotifyAllActorsOfFinalApplicationValidation';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    UPDATE outbox_failures SET subscription_id = 'NotifyNewApplicationNeedsReview' WHERE subscription_id = 'NotifyNewConventionNeedsReview';
    UPDATE outbox_failures SET subscription_id = 'NotifyToAgencyApplicationSubmitted' WHERE subscription_id = 'NotifyToAgencyConventionSubmitted';
    UPDATE outbox_failures SET subscription_id = 'ShareApplicationLinkByEmail' WHERE subscription_id = 'ShareConventionLinkByEmail';
    UPDATE outbox_failures SET subscription_id = 'NotifyAllActorsOfFinalApplicationValidation' WHERE subscription_id = 'NotifyAllActorsOfFinalConventionValidation';
  `);
}
