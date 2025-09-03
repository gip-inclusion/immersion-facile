/* eslint-disable @typescript-eslint/naming-convention */
import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("ft_connect_users", {
    ft_connect_id: { type: "uuid", primaryKey: true },
    advisor_firstname: { type: "text", notNull: false },
    advisor_lastname: { type: "text", notNull: false },
    advisor_email: { type: "text", notNull: false },
    advisor_kind: { type: "text", notNull: false },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createTable("conventions__ft_connect_users", {
    convention_id: {
      type: "uuid",
      primaryKey: true,
      notNull: true,
      references: "conventions(id)",
      onDelete: "CASCADE",
    },
    ft_connect_id: {
      type: "uuid",
      primaryKey: true,
      notNull: true,
      references: "ft_connect_users(ft_connect_id)",
      onDelete: "CASCADE",
    },
    created_at: {
      type: "timestamptz",
      default: pgm.func("now()"),
    },
  });

  pgm.sql(`
    INSERT INTO ft_connect_users (
      ft_connect_id, 
      advisor_firstname, 
      advisor_lastname, 
      advisor_email, 
      advisor_kind,
      created_at,
      updated_at
    )
    SELECT DISTINCT ON (user_pe_external_id)
      user_pe_external_id,
      firstname,
      lastname,
      email,
      type,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM partners_pe_connect
    ORDER BY user_pe_external_id, convention_id;
  `);

  pgm.sql(`
    INSERT INTO conventions__ft_connect_users (convention_id, ft_connect_id)
    SELECT 
      convention_id,
      user_pe_external_id
    FROM partners_pe_connect
    WHERE convention_id != '00000000-0000-0000-0000-000000000000'
      AND EXISTS (
        SELECT 1 FROM conventions c
        WHERE c.id = partners_pe_connect.convention_id
    );
  `);

  pgm.dropTable("partners_pe_connect");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("partners_pe_connect", {
    user_pe_external_id: { type: "uuid", notNull: true },
    convention_id: {
      type: "uuid",
      notNull: true,
      default: "00000000-0000-0000-0000-000000000000",
    },
    firstname: { type: "text", notNull: false },
    lastname: { type: "text", notNull: false },
    email: { type: "text", notNull: false },
    type: { type: "text", notNull: false },
  });

  pgm.addConstraint("partners_pe_connect", "partners_pe_connect_pkey", {
    primaryKey: ["user_pe_external_id", "convention_id"],
  });

  pgm.sql(`
    INSERT INTO partners_pe_connect (
      user_pe_external_id,
      convention_id,
      firstname,
      lastname,
      email,
      type
    )
    SELECT 
      ft_connect_id,
      '00000000-0000-0000-0000-000000000000',
      advisor_firstname,
      advisor_lastname,
      advisor_email,
      advisor_kind
    FROM ft_connect_users
    WHERE ft_connect_id NOT IN (
      SELECT ft_connect_id FROM conventions__ft_connect_users
    );
  `);

  pgm.sql(`
    INSERT INTO partners_pe_connect (
      user_pe_external_id,
      convention_id,
      firstname,
      lastname,
      email,
      type
    )
    SELECT 
      u.ft_connect_id,
      c.convention_id,
      u.advisor_firstname,
      u.advisor_lastname,
      u.advisor_email,
      u.advisor_kind
    FROM ft_connect_users u
    JOIN conventions__ft_connect_users c ON u.ft_connect_id = c.ft_connect_id;
  `);

  pgm.dropTable("conventions__ft_connect_users");
  pgm.dropTable("ft_connect_users");
}
