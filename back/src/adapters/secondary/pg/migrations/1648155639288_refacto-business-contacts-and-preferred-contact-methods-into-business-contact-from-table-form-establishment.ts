/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // 1. Create column business_contact in table form_establishments
  pgm.addColumn("form_establishments", {
    business_contact: { type: "jsonb", notNull: true, default: "{}" },
  });
  // 2.  Migrate content from column preferred_contact_methods to column business_contact
  const buildBusinessContactFromBusinessContactsAndPreferedContactMethods = `
      WITH prepared_view AS 
            (
                WITH contact_info AS 
                (SELECT 
                      siret, 
                     (business_contacts ->> 0)::jsonb AS business_contact_without_contactMethod,
                      preferred_contact_methods ->> 0 AS contactMethod 
                FROM form_establishments
            )
        SELECT siret,
              business_contact_without_contactMethod || jsonb_build_object('contactMethod', contactMethod) AS prepared_business_contact
        FROM contact_info)
      UPDATE form_establishments 
      SET business_contact = prepared_view.prepared_business_contact FROM prepared_view
      WHERE form_establishments.siret = prepared_view.siret`;

  await pgm.sql(
    buildBusinessContactFromBusinessContactsAndPreferedContactMethods,
  );

  // 3. Drop columns preferred_contact_methods and business_contacts
  pgm.dropColumns("form_establishments", [
    "preferred_contact_methods",
    "business_contacts",
  ]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // 1.  Create business_contacts and preferred_contact_methods  columns
  pgm.addColumns("form_establishments", {
    preferred_contact_methods: { type: "jsonb", notNull: true, default: "[]" },
    business_contacts: { type: "jsonb", notNull: true, default: "[]" },
  });
  // 2.  Migrate content from column business_contact to column preferred_contact_methods
  const buildPreferedContactMethodsFromBusinessContact = `
    WITH prepared_view AS (
      SELECT siret, 
      CONCAT('[', (business_contact -> 'contactMethod') , ']')::json AS preferred_contact_methods
      FROM form_establishments
      )
      UPDATE form_establishments 
      SET preferred_contact_methods = prepared_view.preferred_contact_methods FROM prepared_view
      WHERE form_establishments.siret = prepared_view.siret
  `;
  await pgm.sql(buildPreferedContactMethodsFromBusinessContact);

  // 3. Migrate content FROM column business_contact to column business_contacts
  const buildBusinessContactsFromBusinessContact = `
  WITH prepared_view AS 
    (SELECT 
    siret, 
    business_contact - 'contactMethod' AS business_contact_without_contactMethod
    FROM form_establishments)
    UPDATE form_establishments
    SET business_contacts = CONCAT('[', business_contact_without_contactMethod, ']' )::jsonb FROM prepared_view
    WHERE form_establishments.siret = prepared_view.siret
`;
  await pgm.sql(buildBusinessContactsFromBusinessContact);

  // 4. Drop column business_contact
  pgm.dropColumn("form_establishments", "business_contact");
}
