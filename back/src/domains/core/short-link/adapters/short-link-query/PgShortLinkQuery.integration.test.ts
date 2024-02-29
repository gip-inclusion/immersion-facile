import { Pool, PoolClient } from "pg";
import {
  AbsoluteUrl,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { makeKyselyDb } from "../../../../../adapters/secondary/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../adapters/secondary/pg/pgUtils";
import { ShortLinkId } from "../../ports/ShortLinkQuery";
import {
  deleteShortLinkByIdQuery,
  insertShortLinkQuery,
} from "../PgShortLinkHelpers";
import { PgShortLinkRepository } from "../short-link-repository/PgShortLinkRepository";
import {
  PgShortLinkQuery,
  shortLinkIdNotFoundErrorMessage,
} from "./PgShortLinkQuery";

describe("PgShortLinkQuery", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgShortLinkQuery: PgShortLinkQuery;

  const testShortLinkId: ShortLinkId = "000000000000000000000000000000000001";
  const originalUrl: AbsoluteUrl =
    "https://dev.immersion-facile.beta.gouv.fr/verylonglink?queryParams=dfmklghdrfsmgldkrfjhfgdfmkljfghjdfsmfghedrlmkfghdsrflkfghdflkjghdflkjghdfglskjghdlskfghdfgovilèdfsèuyvhberfgvlqermçiufgyeriftuyhrelifgrhdfklwjghdfkljgbndflkjghrdfkljghdfliughdqsfilugheqrtrhrjfkhnskljxbchQSDGFROZERUIGTHERTGHBFS5H455GH23SDF4GD4GDF5G4DF54G2D4GDF4HFYHJ544NX4CFFGDFTG4SETU4YFTGGB54DGWF54TSERD5YH74DFYHGHN4QSD54T7RDFG";

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query(deleteShortLinkByIdQuery(testShortLinkId));
    pgShortLinkQuery = new PgShortLinkRepository(makeKyselyDb(pool));
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("getById", () => {
    it("success", async () => {
      await client.query(insertShortLinkQuery(testShortLinkId, originalUrl));

      expectToEqual(
        await pgShortLinkQuery.getById(testShortLinkId),
        originalUrl,
      );
    });

    it("error: not found", async () => {
      const shortLinkId: ShortLinkId = "notFoundId";
      await expectPromiseToFailWithError(
        pgShortLinkQuery.getById(shortLinkId),
        new Error(shortLinkIdNotFoundErrorMessage(shortLinkId)),
      );
    });
  });
});