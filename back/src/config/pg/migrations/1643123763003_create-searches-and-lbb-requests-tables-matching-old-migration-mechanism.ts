import type { MigrationBuilder } from "node-pg-migrate";

const timestamp = (pgm: MigrationBuilder) => ({
  type: "timestamp",
  default: pgm.func("now()"),
});

export const up = (pgm: MigrationBuilder) => {
  pgm.createTable("lbb_requests", {
    requested_at: { type: "timestamp", primaryKey: true },
    rome: { type: "char(5)" },
    lat: { type: "double", notNull: true },
    lon: { type: "double", notNull: true },
    distance_km: { type: "double", notNull: true },
    result: { type: "jsonb", notNull: true },
  });

  pgm.createTable("searches_made", {
    id: { type: "uuid", primaryKey: true },
    rome: { type: "char(5)" },
    lat: { type: "double", notNull: true },
    lon: { type: "double", notNull: true },
    distance: { type: "double", notNull: true },
    needstobesearched: { type: "boolean" },
    update_date: timestamp(pgm),
    gps: { type: "geography" },
  });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.dropTable("lbb_requests");
  pgm.dropTable("searches_made");
};
