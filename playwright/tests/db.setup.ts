import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

const setupDb = async () => {
  console.log("Starting PostgreSQL testcontainer for E2E tests...");

  const container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const connectionUri = container.getConnectionUri();

  console.log(`PostgreSQL container started: ${connectionUri}`);

  const pool = new Pool({ connectionString: connectionUri });
  const db = new Kysely<Db>({ dialect: new PostgresDialect({ pool }) });

  console.log("Running migrations...");
  await runMigrations(db);
  console.log("Migrations completed");

  await db.destroy();

  writeFileSync(
    CONTAINER_STATE_FILE,
    JSON.stringify({
      containerId: container.getId(),
      connectionUri,
      host: container.getHost(),
      port: container.getPort(),
    }),
  );
};

setupDb();
