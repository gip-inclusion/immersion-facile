import { Pool } from "pg";
import {
  AbsoluteUrl,
  ShortLinkId,
  expectArraysToMatch,
  expectPromiseToFailWithError,
} from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../../config/pg/pgUtils";
import { deleteShortLinkById, getAllShortLinks } from "../PgShortLinkHelpers";
import { PgShortLinkRepository } from "./PgShortLinkRepository";

describe("PgShortLinkRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgShortLinkRepository: PgShortLinkRepository;

  const testShortLinkId: ShortLinkId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const originalUrl: AbsoluteUrl =
    "https://dev.immersion-facile.beta.gouv.fr/verylonglink?queryParams=dfmklghdrfsmgldkrfjhfgdfmkljfghjdfsmfghedrlmkfghdsrflkfghdflkjghdflkjghdfglskjghdlskfghdfgovilèdfsèuyvhberfgvlqermçiufgyeriftuyhrelifgrhdfklwjghdfkljgbndflkjghrdfkljghdfliughdqsfilugheqrtrhrjfkhnskljxbchQSDGFROZERUIGTHERTGHBFS5H455GH23SDF4GD4GDF5G4DF54G2D4GDF4HFYHJ544NX4CFFGDFTG4SETU4YFTGGB54DGWF54TSERD5YH74DFYHGHN4QSD54T7RDFG";

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgShortLinkRepository = new PgShortLinkRepository(db);
    await db.deleteFrom("short_links").execute();
  });

  afterAll(async () => {
    await deleteShortLinkById(db, testShortLinkId);
    await pool.end();
  });

  it("save", async () => {
    await pgShortLinkRepository.save(testShortLinkId, originalUrl);

    expectArraysToMatch(await getAllShortLinks(db), [
      {
        short_link_id: testShortLinkId,
        url: originalUrl,
      },
    ]);
  });

  it("can't save: duplicate shortLinkId", async () => {
    await expectPromiseToFailWithError(
      pgShortLinkRepository.save(testShortLinkId, originalUrl),
      new Error(
        'duplicate key value violates unique constraint "short_link_repository_pkey"',
      ),
    );
  });

  it("can't save: too long shortLinkId", async () => {
    const tooLongId = `${testShortLinkId}0`;
    await expectPromiseToFailWithError(
      pgShortLinkRepository.save(tooLongId, originalUrl),
      new Error("value too long for type character varying(36)"),
    );
  });
});
