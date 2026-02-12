import type { Pool } from "pg";
import {
  type AbsoluteUrl,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  type ShortLinkId,
} from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../../../config/pg/pgPool";
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
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    pgShortLinkRepository = new PgShortLinkRepository(db);
    await db.deleteFrom("short_links").execute();
  });

  afterAll(async () => {
    await deleteShortLinkById(db, testShortLinkId);
    await pool.end();
  });

  it("save", async () => {
    await pgShortLinkRepository.save(testShortLinkId, originalUrl, false);

    expectArraysToMatch(await getAllShortLinks(db), [
      {
        short_link_id: testShortLinkId,
        url: originalUrl,
        single_use: false,
      },
    ]);
  });

  it("save with singleUse true", async () => {
    await pgShortLinkRepository.save(testShortLinkId, originalUrl, true);

    expectArraysToMatch(await getAllShortLinks(db), [
      {
        short_link_id: testShortLinkId,
        url: originalUrl,
        single_use: true,
      },
    ]);
  });

  it("can't save: duplicate shortLinkId", async () => {
    await pgShortLinkRepository.save(testShortLinkId, originalUrl, false);
    expectArraysToMatch(await getAllShortLinks(db), [
      {
        short_link_id: testShortLinkId,
        url: originalUrl,
        single_use: false,
      },
    ]);
    await expectPromiseToFailWithError(
      pgShortLinkRepository.save(testShortLinkId, originalUrl, false),
      new Error(
        'duplicate key value violates unique constraint "short_link_repository_pkey"',
      ),
    );
  });

  it("can't save: too long shortLinkId", async () => {
    const tooLongId = `${testShortLinkId}0`;
    await expectPromiseToFailWithError(
      pgShortLinkRepository.save(tooLongId, originalUrl, false),
      new Error("value too long for type character varying(36)"),
    );
  });
  describe("markAsUsed", () => {
    it("markAsUsed existing shortLink", async () => {
      await pgShortLinkRepository.save(testShortLinkId, originalUrl, true);

      expectArraysToMatch(await getAllShortLinks(db), [
        {
          short_link_id: testShortLinkId,
          url: originalUrl,
          single_use: true,
          last_used_at: null,
        },
      ]);

      const lastUsedAt = new Date();
      await pgShortLinkRepository.markAsUsed(testShortLinkId, lastUsedAt);

      expectArraysToMatch(await getAllShortLinks(db), [
        {
          short_link_id: testShortLinkId,
          url: originalUrl,
          single_use: true,
          last_used_at: lastUsedAt,
        },
      ]);
    });

    it("throws error if shortLink does not exist", async () => {
      const nonExistentId = "non-existent-id";
      await expectPromiseToFailWithError(
        pgShortLinkRepository.markAsUsed(nonExistentId, new Date()),
        errors.shortLink.notFound({ shortLinkId: nonExistentId }),
      );
    });
  });
});
