import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.dropColumn("immersion_applications", "pe_external_id");

    pgm.createTable("partners_pe_connect", {
        id: { type: "uuid", primaryKey: true },
        immersion_application_id: { type: "uuid"},
        pe_external_id: { type: "varchar(255)", notNull: true },
        advisor_firstname: { type: "varchar(255)", notNull: true },
        advisor_lastname: { type: "varchar(255)", notNull: true },
        advisor_email: { type: "varchar(255)", notNull: true },
    });

    // Add foreign key on immersion_appellation_id to reference table immersion_application
    /*pgm.addConstraint("partners_pe_connect", "fk_immersion_appellation", {
        foreignKeys: {
            columns: "immersion_application_id",
            references: "immersion_application(id)",
        },
    });*/
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.addColumn("immersion_applications", {
        pe_external_id: { type: "varchar(255)" },
    });
    pgm.dropTable("partners_pe_connect");
}
