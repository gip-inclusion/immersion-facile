import {
  CompiledQuery,
  Expression,
  ExpressionWrapper,
  Kysely,
  PostgresDialect,
  RawBuilder,
  Simplify,
  sql,
} from "kysely";
import { Pool, QueryResultRow } from "pg";
import { Falsy } from "ramda";
import { createLogger } from "../../../utils/logger";
import { Database } from "./model/database";

export const jsonBuildObject = <O extends Record<string, Expression<unknown>>>(
  obj: O,
): RawBuilder<
  Simplify<{
    [K in keyof O]: O[K] extends Expression<infer V> ? V : never;
  }>
> =>
  sql`json_build_object(${sql.join(
    Object.keys(obj).flatMap((k) => [sql.lit(k), obj[k]]),
  )})`;

type NullableToUndefined<A> = A extends null ? Exclude<A, null> | undefined : A;

type StripNullRecursive<T> = {
  [K in keyof T]: T[K] extends Record<any, unknown>
    ? StripNullRecursive<T[K]>
    : NullableToUndefined<T[K]>;
};

export const jsonStripNulls = <T>(
  obj: RawBuilder<T>,
): RawBuilder<StripNullRecursive<T>> => sql`json_strip_nulls(${obj})`;
export const executeKyselyRawSqlQuery = <T extends QueryResultRow>(
  transaction: Kysely<Database>,
  sqlQuery: string,
  values?: any[],
) => transaction.executeQuery<T>(CompiledQuery.raw(sqlQuery, values));

export const makeKyselyDb = (pool: Pool): Kysely<Database> => {
  const logger = createLogger(__filename);
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    log(event): void {
      if (event.level === "error") {
        const error: any = event.error;
        logger.error({
          message: "SQL ERROR",
          durationMs: event.queryDurationMillis,
          error: "message" in error ? error.message : error,
          sql: event.query.sql,
          params: event.query.parameters,
        });
      }
    },
  });
};

export const cast = <Cast>(query: ExpressionWrapper<any, any, any>) =>
  sql<Cast>`${query}`;

export type KyselyDb = Kysely<Database>;

export const falsyToNull = <T>(value: T | Falsy): T | null =>
  value ? value : null;
