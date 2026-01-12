import { addYears, subYears } from "date-fns";
import { intersection, values } from "ramda";
import type {
  ApiConsumer,
  ApiConsumerId,
  ApiConsumerRights,
  Builder,
  Flavor,
} from "shared";
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import type {
  ApiConsumerRepository,
  GetApiConsumerFilters,
} from "../ports/ApiConsumerRepository";

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
    statistics: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  description: "a",
  revokedAt: null,
  currentKeyIssuedAt: "2023-09-22T10:00:00.000Z",
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
    statistics: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  description: "",
  revokedAt: null,
  currentKeyIssuedAt: "2023-09-22T10:00:00.000Z",
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
    statistics: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  description: "",
  revokedAt: null,
  currentKeyIssuedAt: subYears(new Date(), 2).toISOString(),
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
    statistics: {
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

  public async getByFilters(
    filters: GetApiConsumerFilters,
  ): Promise<ApiConsumer[]> {
    return values(this.#consumers).filter(
      (consumer) =>
        intersection(
          filters.agencyIds ?? [],
          consumer.rights.convention.scope.agencyIds ?? [],
        ).length > 0 ||
        intersection(
          filters.agencyKinds ?? [],
          consumer.rights.convention.scope.agencyKinds ?? [],
        ).length > 0,
    );
  }

  public async save(apiConsumer: ApiConsumer): Promise<void> {
    this.#consumers[apiConsumer.id] = apiConsumer;
  }
}

const defaultApiConsumer: ApiConsumer = {
  id: "aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa",
  name: "unJeuneUneSolution",
  contact: {
    firstName: "john",
    lastName: "doe",
    emails: ["mail@mail.com"],
    job: "tech",
    phone: "+33611223344",
  },
  createdAt: "2020-01-01T00:00:00.000Z",
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
    statistics: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  description: "Default ApiConsumer description for test",
  revokedAt: null,
  currentKeyIssuedAt: "2020-01-01T00:00:00.000Z",
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

  public withName(
    apiConsumerName: Flavor<string, "ApiConsumerName">,
  ): ApiConsumerBuilder {
    return new ApiConsumerBuilder({
      ...this.#dto,
      name: apiConsumerName,
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

  public withRevokedAt(
    revokedAt: ApiConsumer["revokedAt"],
  ): ApiConsumerBuilder {
    return new ApiConsumerBuilder({
      ...this.#dto,
      revokedAt,
    });
  }

  public withCurrentKeyIssuedAt(
    currentKeyIssuedAt: ApiConsumer["currentKeyIssuedAt"],
  ): ApiConsumerBuilder {
    return new ApiConsumerBuilder({
      ...this.#dto,
      currentKeyIssuedAt,
    });
  }

  public withCreatedAt(
    createdAt: ApiConsumer["createdAt"],
  ): ApiConsumerBuilder {
    return new ApiConsumerBuilder({
      ...this.#dto,
      createdAt,
    });
  }

  public withExpirationDate(
    expirationDate: ApiConsumer["expirationDate"],
  ): ApiConsumerBuilder {
    return new ApiConsumerBuilder({
      ...this.#dto,
      expirationDate,
    });
  }
}
