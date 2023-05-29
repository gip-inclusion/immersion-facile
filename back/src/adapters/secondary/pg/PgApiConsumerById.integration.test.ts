import { Pool, PoolClient } from "pg";
import { ApiConsumer, expectToEqual } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { PgApiConsumerRepository } from "./PgApiConsumerRepository";

describe("PG GetApiConsumerById", () => {
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

  it("gets the ApiConsumer from it's ID", async () => {
    const apiConsumer: ApiConsumer = {
      id: "11111111-1111-1111-1111-111111111111",
      consumer: "passeEmploi",
      description: "my description",
      createdAt: new Date(),
      expirationDate: new Date(),
      isAuthorized: true,
    };

    await insertInTable(apiConsumer);

    const apiConsumerFetched = await apiConsumerRepository.getById(
      apiConsumer.id,
    );

    expectToEqual(apiConsumerFetched, apiConsumer);
  });

  const insertInTable = async ({
    id,
    consumer,
    description,
    isAuthorized,
    createdAt,
    expirationDate,
  }: ApiConsumer) => {
    await client.query(
      `INSERT INTO api_consumers (id, consumer, description, is_authorized, created_at, expiration_date)
        VALUES ('${id}', '${consumer}', '${description}', ${isAuthorized}, '${createdAt.toISOString()}', '${expirationDate.toISOString()}');`,
    );
  };
});
