import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
  UPDATE outbox SET topic = 'ConventionSubmittedByBeneficiary' WHERE topic = 'ImmersionApplicationSubmittedByBeneficiary';
  UPDATE outbox SET topic = 'ConventionPartiallySigned' WHERE topic = 'ImmersionApplicationPartiallySigned';
  UPDATE outbox SET topic = 'ConventionFullySigned' WHERE topic = 'ImmersionApplicationFullySigned';
  UPDATE outbox SET topic = 'ConventionAcceptedByCounsellor' WHERE topic = 'ImmersionApplicationAcceptedByCounsellor';
  UPDATE outbox SET topic = 'ConventionAcceptedByValidator' WHERE topic = 'ImmersionApplicationAcceptedByValidator';
  UPDATE outbox SET topic = 'ConventionRejected' WHERE topic = 'ImmersionApplicationRejected';
  UPDATE outbox SET topic = 'ConventionCancelled' WHERE topic = 'ImmersionApplicationCancelled';
  UPDATE outbox SET topic = 'ConventionRequiresModification' WHERE topic = 'ImmersionApplicationRequiresModification';
  `);

  pgm.dropView("view_immersion_application_accepted_by_validator", {
    ifExists: true,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
  UPDATE outbox SET topic = 'ImmersionApplicationSubmittedByBeneficiary' WHERE topic = 'ConventionSubmittedByBeneficiary'; 
  UPDATE outbox SET topic = 'ImmersionApplicationPartiallySigned' WHERE topic = 'ConventionPartiallySigned'; 
  UPDATE outbox SET topic = 'ImmersionApplicationFullySigned' WHERE topic = 'ConventionFullySigned'; 
  UPDATE outbox SET topic = 'ImmersionApplicationAcceptedByCounsellor' WHERE topic = 'ConventionAcceptedByCounsellor'; 
  UPDATE outbox SET topic = 'ImmersionApplicationAcceptedByValidator' WHERE topic = 'ConventionAcceptedByValidator'; 
  UPDATE outbox SET topic = 'ImmersionApplicationRejected' WHERE topic = 'ConventionRejected'; 
  UPDATE outbox SET topic = 'ImmersionApplicationCancelled' WHERE topic = 'ConventionCancelled'; 
  UPDATE outbox SET topic = 'ImmersionApplicationRequiresModification' WHERE topic = 'ConventionRequiresModification'; 
  `);
}
