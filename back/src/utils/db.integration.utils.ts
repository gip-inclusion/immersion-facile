import { expectToEqual } from "shared";
import { KyselyDb } from "../config/pg/kysely/kyselyUtils";

// Use for PG integration debug
export async function isDbEmpty(kyselyDb: KyselyDb) {
  expectToEqual(await kyselyDb.selectFrom("actors").selectAll().execute(), []);
  expectToEqual(
    await kyselyDb.selectFrom("agencies").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("agency_groups").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("agency_groups__agencies").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("api_consumers").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb
      .selectFrom("api_consumers_subscriptions")
      .selectAll()
      .execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("convention_external_ids").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("conventions").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("delegation_contacts").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("discussions").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb
      .selectFrom("establishment_lead_events")
      .selectAll()
      .execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("establishments").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("establishments_contacts").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("establishments_deleted").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("establishments_locations").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("exchanges").selectAll().execute(),
    [],
  );
  // These is feature flags by default
  // expectToEqual(
  //   await kyselyDb.selectFrom("feature_flags").selectAll().execute(),
  //   [],
  // );
  expectToEqual(
    await kyselyDb.selectFrom("form_establishments").selectAll().execute(),
    [],
  );
  expectToEqual(await kyselyDb.selectFrom("groups").selectAll().execute(), []);
  expectToEqual(
    await kyselyDb.selectFrom("groups__sirets").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("immersion_assessments").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("immersion_offers").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb
      .selectFrom("marketing_establishment_contacts")
      .selectAll()
      .execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("notifications_email").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb
      .selectFrom("notifications_email_attachments")
      .selectAll()
      .execute(),
    [],
  );
  expectToEqual(
    await kyselyDb
      .selectFrom("notifications_email_recipients")
      .selectAll()
      .execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("notifications_sms").selectAll().execute(),
    [],
  );
  expectToEqual(await kyselyDb.selectFrom("nps").selectAll().execute(), []);
  expectToEqual(await kyselyDb.selectFrom("outbox").selectAll().execute(), []);
  expectToEqual(
    await kyselyDb.selectFrom("outbox_failures").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("outbox_publications").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("partners_pe_connect").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("broadcast_feedbacks").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("searches_made").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb
      .selectFrom("searches_made__appellation_code")
      .selectAll()
      .execute(),
    [],
  );
  expectToEqual(await kyselyDb.selectFrom("users").selectAll().execute(), []);
  expectToEqual(
    await kyselyDb.selectFrom("users__agencies").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("users_admins").selectAll().execute(),
    [],
  );
  expectToEqual(
    await kyselyDb.selectFrom("users_ongoing_oauths").selectAll().execute(),
    [],
  );
  // DMade from public tables
  // expectToEqual(
  //   await kyselyDb.selectFrom("view_appellations_dto").selectAll().execute(),
  //   [],
  // );
}
