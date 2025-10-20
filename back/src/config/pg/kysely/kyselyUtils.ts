import {
  type Expression,
  type ExpressionWrapper,
  Kysely,
  PostgresDialect,
  type RawBuilder,
  type Simplify,
  sql,
} from "kysely";
import type { Pool } from "pg";
import type { Falsy } from "ramda";
import { createLogger } from "../../../utils/logger";
import { notifyErrorObjectToTeam } from "../../../utils/notifyTeam";
import type { Database } from "./model/database";

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

type KyselyOptions = {
  skipErrorLog?: boolean;
  isDev?: boolean;
};

const ONE_SECOND_IN_MILLISECONDS = 1_000;
const messagePrefix = "sql-query - ";

export const makeKyselyDb = (pool: Pool, options?: KyselyOptions): KyselyDb => {
  const logger = createLogger(__filename);
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    log(event): void {
      if (options?.skipErrorLog) return;
      const durationInSeconds =
        event.queryDurationMillis / ONE_SECOND_IN_MILLISECONDS;
      const sqlQuery = event.query.sql;
      if (event.level === "error") {
        const error: any = event.error;
        const params = {
          message: `${messagePrefix}error`,
          durationInSeconds,
          sqlQuery,
          error: {
            error: "message" in error ? error.message : error,
            params: event.query.parameters,
          },
        };
        notifyErrorObjectToTeam(params);
        logger.error(params);
        return;
      }
      if (event.queryDurationMillis > ONE_SECOND_IN_MILLISECONDS) {
        logger.warn({
          message: `${messagePrefix}too long`,
          durationInSeconds,
          sqlQuery,
        });
        return;
      }
      if (!options?.isDev)
        logger.info({
          message: `${messagePrefix}done`,
          durationInSeconds,
          sqlQuery,
        });
    },
  });
};

export const cast = <Cast>(query: ExpressionWrapper<any, any, any>) =>
  sql<Cast>`${query}`;

export type KyselyDb = Kysely<Database>;

export const falsyToNull = <T>(value: T | Falsy): T | null =>
  value ? value : null;

//https://github.com/kysely-org/kysely/issues/839
//https://old.kyse.link/?p=s&i=C0yoagEodj9vv4AxE3TH
export function values<R extends Record<string, unknown>, A extends string>(
  records: R[],
  alias: A,
) {
  // Assume there's at least one record and all records
  // have the same keys.
  const keys = Object.keys(records[0]);

  // Transform the records into a list of lists such as
  // ($1, $2, $3), ($4, $5, $6)
  const values = sql.join(
    records.map((r) => sql`(${sql.join(keys.map((k) => r[k]))})`),
  );

  // Create the alias `v(id, v1, v2)` that specifies the table alias
  // AND a name for each column.
  const wrappedAlias = sql.ref(alias);
  const wrappedColumns = sql.join(keys.map(sql.ref));
  const aliasSql = sql`${wrappedAlias}(${wrappedColumns})`;

  // Finally create a single `AliasedRawBuilder` instance of the
  // whole thing. Note that we need to explicitly specify
  // the alias type using `.as<A>` because we are using a
  // raw sql snippet as the alias.
  return sql<R>`(values ${values})`.as<A>(aliasSql);
}
