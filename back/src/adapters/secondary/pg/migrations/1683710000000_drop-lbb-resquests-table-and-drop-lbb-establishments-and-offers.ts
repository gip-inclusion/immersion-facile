import { MigrationBuilder } from "node-pg-migrate";

const llbRequestsTableName = "lbb_requests";
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable(llbRequestsTableName);
  pgm.sql("DELETE FROM establishments WHERE data_source = 'api_labonneboite'");
  // will delete link offers too because of the foreign key constraint (on delete cascade)
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable(llbRequestsTableName, {
    requested_at: { type: "timestamp", primaryKey: true },
    rome: { type: "char(5)" },
    lat: { type: "double", notNull: true },
    lon: { type: "double", notNull: true },
    distance_km: { type: "double", notNull: true },
    result: { type: "jsonb", notNull: true },
  });
}
