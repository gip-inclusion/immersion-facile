import { Pool, PoolClient } from "pg";
import { AbsoluteUrl, expectPromiseToFailWithError } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { ShortLinkId } from "../../../domain/core/ports/ShortLinkQuery";
import {
  deleteShortLinkByIdQuery,
  getShortLinkByIdQuery,
  PgShortLinkRepositoryDto,
} from "./pgShortLinkHelpers";
import { PgShortLinkRepository } from "./PgShortLinkRepository";

describe("PgShortLinkRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgShortLinkRepository: PgShortLinkRepository;

  const testShortLinkId: ShortLinkId = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const originalUrl: AbsoluteUrl =
    "https://dev.immersion-facile.beta.gouv.fr/verylonglink?queryParams=dfmklghdrfsmgldkrfjhfgdfmkljfghjdfsmfghedrlmkfghdsrflkfghdflkjghdflkjghdfglskjghdlskfghdfgovilèdfsèuyvhberfgvlqermçiufgyeriftuyhrelifgrhdfklwjghdfkljgbndflkjghrdfkljghdfliughdqsfilugheqrtrhrjfkhnskljxbchQSDGFROZERUIGTHERTGHBFS5H455GH23SDF4GD4GDF5G4DF54G2D4GDF4HFYHJ544NX4CFFGDFTG4SETU4YFTGGB54DGWF54TSERD5YH74DFYHGHN4QSD54T7RDFG";

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query(deleteShortLinkByIdQuery(testShortLinkId));
  });

  beforeEach(() => {
    pgShortLinkRepository = new PgShortLinkRepository(client);
  });

  afterAll(async () => {
    await client.query(deleteShortLinkByIdQuery(testShortLinkId));
    client.release();
    await pool.end();
  });

  it("save", async () => {
    await pgShortLinkRepository.save(testShortLinkId, originalUrl);

    const { rows } = await client.query<PgShortLinkRepositoryDto>(
      getShortLinkByIdQuery(testShortLinkId),
    );

    expect(rows.length === 1).toBeTruthy();
    const expectedResult = rows.at(0)!;
    expect(expectedResult.short_link_id).toEqual(testShortLinkId);
    expect(expectedResult.url).toEqual(originalUrl);
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
