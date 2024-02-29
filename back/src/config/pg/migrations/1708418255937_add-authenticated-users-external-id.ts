import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn("authenticated_users", {
    external_id: {
      type: "text",
      unique: true,
    },
  });
  pgm.addConstraint(
    "ongoing_oauths",
    "ongoing_oauths_refers_to_authenticated_users_id_fkey",
    {
      foreignKeys: {
        columns: "user_id",
        references: "authenticated_users(id)",
      },
    },
  );
  pgm.sql(`
      UPDATE authenticated_users
      SET external_id = ongoing_oauths.external_id
          FROM ongoing_oauths
      WHERE ongoing_oauths.user_id = authenticated_users.id;
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("authenticated_users", "external_id");
  pgm.dropConstraint(
    "ongoing_oauths",
    "ongoing_oauths_refers_to_authenticated_users_id_fkey",
  );
}
