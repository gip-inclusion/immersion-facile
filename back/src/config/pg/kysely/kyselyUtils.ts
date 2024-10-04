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
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
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
  transaction: KyselyDb,
  sqlQuery: string,
  values?: any[],
) => transaction.executeQuery<T>(CompiledQuery.raw(sqlQuery, values));

type KyselyOptions = {
  skipErrorLog?: boolean;
};

export const makeKyselyDb = (pool: Pool, options?: KyselyOptions): KyselyDb => {
  const logger = createLogger(__filename);
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    log(event): void {
      if (options?.skipErrorLog) return;
      if (event.level === "error") {
        const error: any = event.error;
        const params = {
          message: "SQL ERROR",
          durationInSeconds: event.queryDurationMillis / 1000,
          error: {
            error: "message" in error ? error.message : error,
            query: event.query.sql,
            params: event.query.parameters,
          },
        };
        notifyObjectDiscord(params);
        logger.error(params);
      } else if (event.queryDurationMillis > 1_000) {
        logger.warn({
          message: "SQL QUERY TOO LONG",
          durationInSeconds: event.queryDurationMillis / 1000,
          error: { query: event.query.sql },
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
