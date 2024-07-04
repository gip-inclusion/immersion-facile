import { addYears, subYears } from "date-fns";
import { values } from "ramda";
import { ApiConsumer, ApiConsumerId, ApiConsumerRights, Builder } from "shared";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { ApiConsumerRepository } from "../ports/ApiConsumerRepository";

const uuidGenerator = new UuidV4Generator();

export const authorizedUnJeuneUneSolutionApiConsumer: ApiConsumer = {
  id: uuidGenerator.new(),
  createdAt: "2023-09-22T10:00:00.000Z",
  expirationDate: "2025-09-22T10:00:00.000Z",
  name: "unJeuneUneSolution",
  contact: {
    firstName: "john",
    lastName: "doe",
    emails: ["mail@mail.com"],
    job: "tech",
    phone: "+33611223344",
  },
  rights: {
    searchEstablishment: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
    convention: {
      kinds: ["READ"],
      scope: {
        agencyIds: [],
      },
      subscriptions: [],
    },
    establishmentStats: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  description: "a",
};

export const unauthorizedApiConsumer: ApiConsumer = {
  id: uuidGenerator.new(),
  createdAt: "2023-09-22T10:00:00.000Z",
  expirationDate: "2025-09-22T10:00:00.000Z",
  name: "unauthorised consumer",
  contact: {
    firstName: "john",
    lastName: "doe",
    emails: ["mail@mail.com"],
    job: "tech",
    phone: "+33611223344",
  },
  rights: {
    searchEstablishment: {
      kinds: [],
      scope: "no-scope",
      subscriptions: [],
    },
    convention: {
      kinds: [],
      scope: {
        agencyIds: [],
      },
      subscriptions: [],
    },
    establishmentStats: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  description: "",
};

export const outdatedApiConsumer: ApiConsumer = {
  id: uuidGenerator.new(),
  name: "outdated consumer",
  contact: {
    firstName: "john",
    lastName: "doe",
    emails: ["mail@mail.com"],
    job: "tech",
    phone: "+33611223344",
  },
  createdAt: subYears(new Date(), 2).toISOString(),
  expirationDate: subYears(new Date(), 1).toISOString(),
  rights: {
    searchEstablishment: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
    convention: {
      kinds: ["READ"],
      scope: {
        agencyIds: [],
      },
      subscriptions: [],
    },
    establishmentStats: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  description: "",
};

export const authorizedSubscriptionApiConsumer: ApiConsumer = {
  ...authorizedUnJeuneUneSolutionApiConsumer,
  rights: {
    convention: {
      kinds: ["SUBSCRIPTION"],
      scope: {
        agencyKinds: [],
      },
      subscriptions: [],
    },
    searchEstablishment: {
      kinds: [],
      scope: "no-scope",
      subscriptions: [],
    },
    establishmentStats: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
};

export class InMemoryApiConsumerRepository implements ApiConsumerRepository {
  #consumers: Record<ApiConsumerId, ApiConsumer> = {};

  public get consumers(): ApiConsumer[] {
    return values(this.#consumers);
  }

  public set consumers(consumers: ApiConsumer[]) {
    this.#consumers = consumers.reduce<Record<ApiConsumerId, ApiConsumer>>(
      (agg, consumer) => ({ ...agg, [consumer.id]: consumer }),
      {},
    );
  }

  public async getAll(): Promise<ApiConsumer[]> {
    return values(this.#consumers);
  }

  public async getById(id: ApiConsumerId): Promise<ApiConsumer | undefined> {
    return this.#consumers[id];
  }

  public async save(apiConsumer: ApiConsumer): Promise<void> {
    this.#consumers[apiConsumer.id] = apiConsumer;
  }
}

const defaultApiConsumer: ApiConsumer = {
  id: "aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa",
  name: "unJeuneUneSolution",
  contact: {
    firstName: "john",
    lastName: "doe",
    emails: ["mail@mail.com"],
    job: "tech",
    phone: "+33611223344",
  },
  createdAt: new Date().toISOString(),
  expirationDate: addYears(new Date(), 1).toISOString(),
  rights: {
    searchEstablishment: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
    convention: {
      kinds: ["READ"],
      scope: {
        agencyIds: [],
      },
      subscriptions: [],
    },
    establishmentStats: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  description: "Default ApiConsumer description for test",
};

export class ApiConsumerBuilder implements Builder<ApiConsumer> {
  #dto: ApiConsumer;

  constructor(dto: ApiConsumer = defaultApiConsumer) {
    this.#dto = dto;
  }

  public build(): ApiConsumer {
    return this.#dto;
  }

  public withConventionRight(
    conventionRight: ApiConsumerRights["convention"],
  ): ApiConsumerBuilder {
    return this.withRights({
      convention: conventionRight,
    });
  }

  public withRights(rights: Partial<ApiConsumerRights>): ApiConsumerBuilder {
    return new ApiConsumerBuilder({
      ...this.#dto,
      rights: {
        ...this.#dto.rights,
        ...rights,
      },
    });
  }

  public withId(id: ApiConsumer["id"]): ApiConsumerBuilder {
    return new ApiConsumerBuilder({
      ...this.#dto,
      id,
    });
  }
}
