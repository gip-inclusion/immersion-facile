import { CompiledQuery, Kysely, PostgresDialect } from "kysely";
import { Pool, QueryResultRow } from "pg";
import { Database } from "./model/database";

export const executeKyselyRawSqlQuery = <T extends QueryResultRow>(
  transaction: Kysely<Database>,
  sqlQuery: string,
  values?: any[],
) => transaction.executeQuery<T>(CompiledQuery.raw(sqlQuery, values));

export const makeKyselyDb = (pool: Pool): Kysely<Database> =>
  new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });

export type KyselyDb = Kysely<Database>;
