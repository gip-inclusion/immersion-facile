import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("establishments__users", {
    is_main_contact_by_phone: {
      type: "boolean",
      default: null,
    },
  });

  pgm.sql(`
    WITH phone_establishments AS (
      -- Get establishments with PHONE contact mode
      SELECT siret
      FROM establishments
      WHERE contact_mode = 'PHONE'
    ),
    establishment_user_counts AS (
      -- Count users per establishment and identify cases
      SELECT 
        eu.siret,
        COUNT(*) as total_users,
        COUNT(CASE WHEN eu.phone IS NOT NULL THEN 1 END) as users_with_phone,
        COUNT(CASE WHEN eu.role = 'establishment-admin' AND eu.phone IS NOT NULL THEN 1 END) as admins_with_phone
      FROM establishments__users eu
      INNER JOIN phone_establishments pe ON eu.siret = pe.siret
      GROUP BY eu.siret
    ),
    users_to_update AS (
      SELECT DISTINCT ON (eu.siret) 
        eu.siret,
        eu.user_id,
        euc.total_users,
        euc.users_with_phone,
        euc.admins_with_phone
      FROM establishments__users eu
      INNER JOIN establishment_user_counts euc ON eu.siret = euc.siret
      WHERE 
        -- Case 1: Only one user total
        (euc.total_users = 1)
        OR
        -- Case 2: Multiple users but only one has phone
        (euc.total_users > 1 AND euc.users_with_phone = 1 AND eu.phone IS NOT NULL)
        OR
        -- Case 3: Multiple users with phones, but only one admin with phone
        (euc.users_with_phone > 1 AND euc.admins_with_phone = 1 AND eu.role = 'establishment-admin' AND eu.phone IS NOT NULL)
        OR
        -- Case 4: Multiple admins with phones, take the first one (ordered by user_id for consistency)
        (euc.admins_with_phone > 1 AND eu.role = 'establishment-admin' AND eu.phone IS NOT NULL)
      ORDER BY 
        eu.siret,
        -- Prioritize admin users when multiple admins with phones
        CASE WHEN euc.admins_with_phone > 1 THEN eu.user_id END
    )
    UPDATE establishments__users 
    SET is_main_contact_by_phone = true
    FROM users_to_update utu
    WHERE establishments__users.siret = utu.siret 
      AND establishments__users.user_id = utu.user_id;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("establishments__users", ["is_main_contact_by_phone"]);
}
