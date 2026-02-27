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
import type { ShortLink } from "../../ports/ShortLinkQuery";
import { deleteShortLinkById, getAllShortLinks } from "../PgShortLinkHelpers";
import { PgShortLinkRepository } from "./PgShortLinkRepository";

describe("PgShortLinkRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgShortLinkRepository: PgShortLinkRepository;

  const testShortLinkId: ShortLinkId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const originalUrl: AbsoluteUrl =
    "https://dev.immersion-facile.beta.gouv.fr/verylonglink?queryParams=dfmklghdrfsmgldkrfjhfgdfmkljfghjdfsmfghedrlmkfghdsrflkfghdflkjghdflkjghdfglskjghdlskfghdfgovilèdfsèuyvhberfgvlqermçiufgyeriftuyhrelifgrhdfklwjghdfkljgbndflkjghrdfkljghdfliughdqsfilugheqrtrhrjfkhnskljxbchQSDGFROZERUIGTHERTGHBFS5H455GH23SDF4GD4GDF5G4DF54G2D4GDF4HFYHJ544NX4CFFGDFTG4SETU4YFTGGB54DGWF54TSERD5YH74DFYHGHN4QSD54T7RDFG";

  const unusedShortLink: ShortLink = {
    id: testShortLinkId,
    url: originalUrl,
    lastUsedAt: null,
  };

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
    await pgShortLinkRepository.save(unusedShortLink);

    expectArraysToMatch(await getAllShortLinks(db), [unusedShortLink]);
  });

  it("save : update last used at", async () => {
    await pgShortLinkRepository.save(unusedShortLink);

    expectArraysToMatch(await getAllShortLinks(db), [unusedShortLink]);

    const updatedShortLink: ShortLink = {
      ...unusedShortLink,
      lastUsedAt: new Date(),
    };
    await pgShortLinkRepository.save(updatedShortLink);

    expectArraysToMatch(await getAllShortLinks(db), [updatedShortLink]);
  });

  it("can't save: url can't be changed", async () => {
    await pgShortLinkRepository.save(unusedShortLink);

    expectArraysToMatch(await getAllShortLinks(db), [unusedShortLink]);

    await expectPromiseToFailWithError(
      pgShortLinkRepository.save({
        ...unusedShortLink,
        url: "http://newURL",
      }),
      errors.shortLink.forbiddenLinkUpdate(),
    );
  });

  it("can't save: too long shortLinkId", async () => {
    const tooLongId = `${testShortLinkId}0`;
    await expectPromiseToFailWithError(
      pgShortLinkRepository.save({
        id: tooLongId,
        url: originalUrl,
        lastUsedAt: null,
      }),
      new Error("value too long for type character varying(36)"),
    );
  });
});
