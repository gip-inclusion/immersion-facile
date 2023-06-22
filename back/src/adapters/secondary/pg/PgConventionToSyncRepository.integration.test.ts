import { Pool, PoolClient } from "pg";
import { expectToEqual } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { ConventionToSync } from "../../../domain/convention/ports/ConventionToSyncRepository";
import {
  conventionToSyncTableName,
  PgConventionToSyncRepository,
} from "./PgConventionToSyncRepository";

describe("PgConventionRepository", () => {
  const conventionToSyncs: ConventionToSync[] = [
    {
      id: "aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaa1",
      status: "TO_PROCESS",
    },
    {
      id: "aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaa2",
      status: "SUCCESS",
      processDate: new Date(),
    },
    {
      id: "aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaa3",
      status: "ERROR",
      processDate: new Date(),
      reason: "An error",
    },
    {
      id: "aaaaac99-9c0b-1bbb-bb6d-6bb9bd38aaa4",
      status: "SKIP",
      processDate: new Date(),
      reason: "Skipped reason",
    },
  ];

  let pool: Pool;
  let client: PoolClient;
  let conventionRepositoryToSyncRepository: PgConventionToSyncRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query(`DELETE
                        FROM ${conventionToSyncTableName}`);
    conventionRepositoryToSyncRepository = new PgConventionToSyncRepository(
      client,
    );
  });

  it.each(conventionToSyncs)(
    `save and getById convention with status '$status'`,
    async (conventionToSync) => {
      expectToEqual(
        await conventionRepositoryToSyncRepository.getById(conventionToSync.id),
        undefined,
      );

      await conventionRepositoryToSyncRepository.save(conventionToSync);

      const syncedConvention =
        await conventionRepositoryToSyncRepository.getById(conventionToSync.id);
      expectToEqual(syncedConvention, conventionToSync);
    },
  );

  describe("getNotProcessedAndErrored", () => {
    beforeEach(() =>
      Promise.all(
        conventionToSyncs.map((conventionToSync) =>
          conventionRepositoryToSyncRepository.save(conventionToSync),
        ),
      ),
    );

    it("only TO_PROCESS and ERROR", async () => {
      const conventionsToSyncNotProcessedAndErrored =
        await conventionRepositoryToSyncRepository.getNotProcessedAndErrored(
          10000,
        );

      expectToEqual(conventionsToSyncNotProcessedAndErrored, [
        conventionToSyncs[0],
        conventionToSyncs[2],
      ]);
    });

    it("with limit 1", async () => {
      const conventionsToSyncNotProcessedAndErrored =
        await conventionRepositoryToSyncRepository.getNotProcessedAndErrored(1);

      expectToEqual(conventionsToSyncNotProcessedAndErrored, [
        conventionToSyncs[0],
      ]);
    });
  });
});
