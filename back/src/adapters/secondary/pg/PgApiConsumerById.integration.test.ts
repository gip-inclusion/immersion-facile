import { Pool, PoolClient } from "pg";
import { ApiConsumer, expectToEqual } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { UuidV4Generator } from "../core/UuidGeneratorImplementations";
import { PgApiConsumerRepository } from "./PgApiConsumerRepository";

describe("PgApiConsumerRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let apiConsumerRepository: PgApiConsumerRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM api_consumers");
    apiConsumerRepository = new PgApiConsumerRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("save & getById", async () => {
    const apiConsumer: ApiConsumer = {
      id: new UuidV4Generator().new(),
      consumer: "passeEmploi",
      description: "my description",
      contact: {
        firstName: "john",
        lastName: "doe",
        emails: ["email@mail.com"],
        job: "job",
        phone: "0644889977",
      },
      createdAt: new Date(),
      expirationDate: new Date(),
      rights: {
        searchEstablishment: {
          kinds: ["READ"],
          scope: "no-scope",
        },
        convention: {
          kinds: ["READ"],
          scope: {
            agencyKinds: [],
            agencyIds: [],
          },
        },
      },
    };

    expectToEqual(
      await apiConsumerRepository.getById(apiConsumer.id),
      undefined,
    );

    await apiConsumerRepository.save(apiConsumer);
    expectToEqual(
      await apiConsumerRepository.getById(apiConsumer.id),
      apiConsumer,
    );

    const updatedApiConsumer: ApiConsumer = {
      id: apiConsumer.id,
      consumer: "passeEmploiupdated",
      contact: {
        firstName: "john 5",
        lastName: "manson",
        emails: ["john-v@mail.com"],
        job: "guitariste",
        phone: "0606660666",
      },
      createdAt: new Date(),
      expirationDate: new Date(),
      rights: {
        searchEstablishment: {
          kinds: ["READ"],
          scope: "no-scope",
        },
        convention: {
          kinds: ["READ"],
          scope: {
            agencyKinds: [],
            agencyIds: [],
          },
        },
      },
    };

    await apiConsumerRepository.save(updatedApiConsumer);
    expectToEqual(
      await apiConsumerRepository.getById(apiConsumer.id),
      updatedApiConsumer,
    );
  });
});
