import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.noTransaction();
  // biome-ignore-start lint/suspicious/noUselessEscapeInString: sql query
  pgm.addIndex("outbox", `(\"payload\" ->> 'siret')`, {
    name: "outbox_payload_siret_index",
    concurrently: true,
  });
  pgm.addIndex(
    "outbox",
    `(\"payload\" -> 'establishmentAggregate' -> 'establishment' ->> 'siret')`,
    {
      name: "outbox_payload_establishmentAggregate_establishment_siret_index",
      concurrently: true,
    },
  );
  pgm.addIndex("outbox", `(\"payload\" -> 'discussion' ->> 'siret')`, {
    name: "outbox_payload_discussion_siret_index",
    concurrently: true,
  });
  // biome-ignore-end lint/suspicious/noUselessEscapeInString: sql query
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.noTransaction();
  pgm.dropIndex("outbox", "outbox_payload_siret_index", { concurrently: true });
  pgm.dropIndex(
    "outbox",
    "outbox_payload_establishmentAggregate_establishment_siret_index",
    { concurrently: true },
  );
  pgm.dropIndex("outbox", "outbox_payload_discussion_siret_index", {
    concurrently: true,
  });
}
