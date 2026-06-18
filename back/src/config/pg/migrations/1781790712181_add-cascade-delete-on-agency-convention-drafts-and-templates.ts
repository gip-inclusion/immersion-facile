import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("convention_drafts", "convention_drafts_agency_id_fk");
  pgm.addConstraint("convention_drafts", "convention_drafts_agency_id_fk", {
    foreignKeys: {
      columns: "agency_id",
      references: "agencies(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.dropConstraint(
    "convention_templates",
    "convention_templates_agency_id_fk",
  );
  pgm.addConstraint(
    "convention_templates",
    "convention_templates_agency_id_fk",
    {
      foreignKeys: {
        columns: "agency_id",
        references: "agencies(id)",
        onDelete: "CASCADE",
      },
    },
  );

  pgm.dropConstraint(
    "agency_groups__agencies",
    "agency_groups__agencies_agency_id_fkey",
  );
  pgm.addConstraint(
    "agency_groups__agencies",
    "agency_groups__agencies_agency_id_fkey",
    {
      foreignKeys: {
        columns: "agency_id",
        references: "agencies(id)",
        onDelete: "CASCADE",
      },
    },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint(
    "agency_groups__agencies",
    "agency_groups__agencies_agency_id_fkey",
  );
  pgm.addConstraint(
    "agency_groups__agencies",
    "agency_groups__agencies_agency_id_fkey",
    {
      foreignKeys: {
        columns: "agency_id",
        references: "agencies(id)",
      },
    },
  );

  pgm.dropConstraint(
    "convention_templates",
    "convention_templates_agency_id_fk",
  );
  pgm.addConstraint(
    "convention_templates",
    "convention_templates_agency_id_fk",
    {
      foreignKeys: {
        columns: "agency_id",
        references: "agencies(id)",
      },
    },
  );

  pgm.dropConstraint("convention_drafts", "convention_drafts_agency_id_fk");
  pgm.addConstraint("convention_drafts", "convention_drafts_agency_id_fk", {
    foreignKeys: {
      columns: "agency_id",
      references: "agencies(id)",
    },
  });
}
