import { Kysely, PostgresDialect } from "kysely";
import { Pool, PoolClient } from "pg";
import { expectToEqual } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { ConventionToSync } from "../../../domain/convention/ports/ConventionsToSyncRepository";
import { ImmersionDatabase } from "./sql/database";
import {
  conventionsToSyncTableName,
  PgConventionsToSyncRepository,
} from "./PgConventionsToSyncRepository";

describe("PgConventionsRepository", () => {
  const conventionsToSync: ConventionToSync[] = [
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
  let conventionsToSyncRepository: PgConventionsToSyncRepository;

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
                        FROM ${conventionsToSyncTableName}`);
    conventionsToSyncRepository = new PgConventionsToSyncRepository(
      new Kysely<ImmersionDatabase>({
        dialect: new PostgresDialect({ pool }),
      }),
    );
  });

  it.each(conventionsToSync)(
    `save and getById convention with status '$status'`,
    async (conventionToSync) => {
      expectToEqual(
        await conventionsToSyncRepository.getById(conventionToSync.id),
        undefined,
      );

      await conventionsToSyncRepository.save(conventionToSync);

      const syncedConvention = await conventionsToSyncRepository.getById(
        conventionToSync.id,
      );
      expectToEqual(syncedConvention, conventionToSync);
    },
  );

  it(`save updated conventionToSync`, async () => {
    const initialConventionToSync: ConventionToSync = conventionsToSync[0];
    await conventionsToSyncRepository.save(initialConventionToSync);

    const updatedConventionToSync: ConventionToSync = {
      ...conventionsToSync[0],
      status: "SUCCESS",
      processDate: new Date(),
    };
    await conventionsToSyncRepository.save(updatedConventionToSync);

    expectToEqual(
      await conventionsToSyncRepository.getById(initialConventionToSync.id),
      updatedConventionToSync,
    );
  });

  describe("getNotProcessedAndErrored", () => {
    beforeEach(() =>
      Promise.all(
        conventionsToSync.map((conventionToSync) =>
          conventionsToSyncRepository.save(conventionToSync),
        ),
      ),
    );

    it("only TO_PROCESS and ERROR", async () => {
      const conventionsToSyncNotProcessedAndErrored =
        await conventionsToSyncRepository.getToProcessOrError(10000);

      expectToEqual(conventionsToSyncNotProcessedAndErrored, [
        conventionsToSync[0],
        conventionsToSync[2],
      ]);
    });

    it("with limit 1", async () => {
      const processedAndErrorConventionIds = [
        conventionsToSync[0].id,
        conventionsToSync[2].id,
      ];
      const conventionsToSyncNotProcessedAndErrored =
        await conventionsToSyncRepository.getToProcessOrError(1);

      expectToEqual(conventionsToSyncNotProcessedAndErrored.length, 1);
      expect(processedAndErrorConventionIds).toContain(
        conventionsToSyncNotProcessedAndErrored[0].id,
      );
    });
  });
});
