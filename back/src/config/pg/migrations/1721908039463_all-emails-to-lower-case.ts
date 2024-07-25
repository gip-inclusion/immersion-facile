import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    "update actors set email = lower(email) where lower(email) != email;",
  );
  pgm.sql(
    "update marketing_establishment_contacts set email = lower(email) where lower(email) != email;",
  );
  pgm.sql("update users set email = lower(email) where lower(email) != email;");
  pgm.sql(
    "update discussions set potential_beneficiary_email = lower(potential_beneficiary_email) where lower(potential_beneficiary_email) != potential_beneficiary_email;",
  );
  pgm.sql(
    "update discussions set establishment_contact_email = lower(establishment_contact_email) where lower(establishment_contact_email) != establishment_contact_email;",
  );
  pgm.sql(`
    update discussions
    set establishment_contact_copy_emails = (
        select jsonb_agg(lower(email))
        FROM jsonb_array_elements_text(discussions.establishment_contact_copy_emails) AS email
    )
    where id in (
        select d.id
        from discussions d
        where EXISTS (
            select 1
            from jsonb_array_elements_text(d.establishment_contact_copy_emails) AS email
            where email <> lower(email)
        ))
  `);

  pgm.sql(
    "update establishments_contacts set email = lower(email) where lower(email) != email;",
  );
  pgm.sql(`
      update establishments_contacts ec
      set copy_emails = (select jsonb_agg(lower(copy_email))
                         from jsonb_array_elements_text(ec.copy_emails) AS copy_email)
      where uuid in (select c.uuid
         from establishments_contacts c
         where EXISTS (select 1
             from jsonb_array_elements_text(c.copy_emails) AS copy_email
             where copy_email <> lower(copy_email)
         )
      )
  `);
  pgm.sql(`
    update form_establishments fe
    set business_contact = jsonb_set(
            business_contact,
            '{email}',
            to_jsonb(lower(fe.business_contact->>'email'))
        )
    where lower(fe.business_contact->>'email') != fe.business_contact->>'email';
  `);
}

export async function down(): Promise<void> {
  // nothing to do
}
