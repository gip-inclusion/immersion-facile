import { Pool, PoolClient } from "pg";
import { ApiConsumer, expectToEqual, WebhookSubscription } from "shared";
import { UuidV4Generator } from "../../core/UuidGeneratorImplementations";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgApiConsumerRepository } from "./PgApiConsumerRepository";

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
  createdAt: new Date().toISOString(),
  expirationDate: new Date().toISOString(),
  rights: {
    searchEstablishment: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
    convention: {
      kinds: ["READ"],
      scope: {
        agencyKinds: [],
      },
      subscriptions: [],
    },
  },
};

describe("PgApiConsumerRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let apiConsumerRepository: PgApiConsumerRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM api_consumers");
    apiConsumerRepository = new PgApiConsumerRepository(makeKyselyDb(pool));
  });

  it("save & getById", async () => {
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
      createdAt: new Date().toISOString(),
      expirationDate: new Date().toISOString(),
      rights: {
        searchEstablishment: {
          kinds: ["READ"],
          scope: "no-scope",
          subscriptions: [],
        },
        convention: {
          kinds: ["READ"],
          scope: {
            agencyKinds: [],
          },
          subscriptions: [],
        },
      },
    };

    await apiConsumerRepository.save(updatedApiConsumer);
    expectToEqual(
      await apiConsumerRepository.getById(apiConsumer.id),
      updatedApiConsumer,
    );
  });

  describe("getAll", () => {
    it("returns empty array when no consumers found", async () => {
      expectToEqual(await apiConsumerRepository.getAll(), []);
    });

    it("returns all api consumers", async () => {
      await apiConsumerRepository.save(apiConsumer);
      expectToEqual(await apiConsumerRepository.getAll(), [apiConsumer]);
    });
  });

  describe("addSubscription", () => {
    it("add first subscription", async () => {
      expect(apiConsumer.rights.convention.subscriptions).toEqual([]);
      await apiConsumerRepository.save(apiConsumer);

      const subscription: WebhookSubscription = {
        callbackUrl: "https://partner-callback-url",
        callbackHeaders: {
          authorization: "my-cb-auth-header",
          "X-Gravitee-Api-Key": "gravitee",
        },
        subscribedEvent: "convention.updated",
        createdAt: new Date().toISOString(),
        id: new UuidV4Generator().new(),
      };

      const updatedConsumer: ApiConsumer = {
        ...apiConsumer,
        rights: {
          ...apiConsumer.rights,
          convention: {
            ...apiConsumer.rights.convention,
            subscriptions: [subscription],
          },
        },
      };

      await apiConsumerRepository.save(updatedConsumer);

      const updatedConsumerInRepo = await apiConsumerRepository.getById(
        updatedConsumer.id,
      );
      expectToEqual(updatedConsumerInRepo, updatedConsumer);
    });
  });
});
