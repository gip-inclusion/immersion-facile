import { Pool } from "pg";
import { NarrowEvent } from "../../domain/core/eventBus/EventBus";
import { AppConfig } from "./appConfig";

const doTheJob = async () => {
  console.time("duration");
  const config = AppConfig.createFromEnv();
  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });
  const client = await pool.connect();

  const result = await client.query(`SELECT id, payload FROM outbox
  WHERE topic = 'FormEstablishmentAdded' AND was_quarantined = true 
  ORDER BY "occurred_at"
  DESC LIMIT 300;`);

  const rows = result.rows as NarrowEvent<"FormEstablishmentAdded">[];

  for (const row of rows) {
    const newPayload = { ...row.payload, source: "immersion-facile" };
    try {
      await client.query("UPDATE outbox SET payload = $1 WHERE id = $2", [
        newPayload,
        row.id,
      ]);
    } catch (e) {
      console.log("Failed on id : ", row.id);
      console.error(e);
    }
  }

  client.release();
  await pool.end();
  console.log("All good");
  console.timeEnd("duration");
};

doTheJob();
