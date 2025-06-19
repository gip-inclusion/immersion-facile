import type { Pool } from "pg";
import {
  type ApiConsumer,
  expectToEqual,
  type WebhookSubscription,
} from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { PgApiConsumerRepository } from "./PgApiConsumerRepository";

const apiConsumer: ApiConsumer = {
  id: new UuidV4Generator().new(),
  name: "passeEmploi",
  description: "my description",
  contact: {
    firstName: "john",
    lastName: "doe",
    emails: ["email@mail.com"],
    job: "job",
    phone: "+33644889977",
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
    statistics: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
};

describe("PgApiConsumerRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let apiConsumerRepository: PgApiConsumerRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    apiConsumerRepository = new PgApiConsumerRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("api_consumers").execute();
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
      name: "passeEmploiupdated",
      contact: {
        firstName: "john 5",
        lastName: "manson",
        emails: ["john-v@mail.com"],
        job: "guitariste",
        phone: "+33606660666",
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
        statistics: {
          kinds: ["READ"],
          scope: "no-scope",
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
