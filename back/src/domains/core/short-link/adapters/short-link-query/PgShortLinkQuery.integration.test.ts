import { Pool } from "pg";
import {
  AbsoluteUrl,
  ShortLinkId,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import {
  deleteShortLinkById,
  insertShortLinkQuery,
} from "../PgShortLinkHelpers";
import {
  PgShortLinkQuery,
  shortLinkIdNotFoundErrorMessage,
} from "./PgShortLinkQuery";

describe("PgShortLinkQuery", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgShortLinkQuery: PgShortLinkQuery;

  const testShortLinkId: ShortLinkId = "000000000000000000000000000000000001";
  const originalUrl: AbsoluteUrl =
    "https://dev.immersion-facile.beta.gouv.fr/verylonglink?queryParams=dfmklghdrfsmgldkrfjhfgdfmkljfghjdfsmfghedrlmkfghdsrflkfghdflkjghdflkjghdfglskjghdlskfghdfgovilèdfsèuyvhberfgvlqermçiufgyeriftuyhrelifgrhdfklwjghdfkljgbndflkjghrdfkljghdfliughdqsfilugheqrtrhrjfkhnskljxbchQSDGFROZERUIGTHERTGHBFS5H455GH23SDF4GD4GDF5G4DF54G2D4GDF4HFYHJ544NX4CFFGDFTG4SETU4YFTGGB54DGWF54TSERD5YH74DFYHGHN4QSD54T7RDFG";

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgShortLinkQuery = new PgShortLinkQuery(db);
  });

  beforeEach(async () => {
    await deleteShortLinkById(db, testShortLinkId);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getById", () => {
    it("success", async () => {
      await insertShortLinkQuery(db, testShortLinkId, originalUrl);

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
