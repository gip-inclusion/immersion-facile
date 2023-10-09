import {
  CompiledQuery,
  Expression,
  Kysely,
  PostgresDialect,
  RawBuilder,
  Simplify,
  sql,
} from "kysely";
import { Pool, QueryResultRow } from "pg";
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

export const makeKyselyDb = (pool: Pool): Kysely<Database> =>
  new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });

export type KyselyDb = Kysely<Database>;
