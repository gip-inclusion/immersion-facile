import { addYears } from "date-fns";
import { ApiConsumer, ApiConsumerRights, Builder } from "shared";

const defaultApiConsumer: ApiConsumer = {
  id: "aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa",
  consumer: "unJeuneUneSolution",
  contact: {
    firstName: "john",
    lastName: "doe",
    emails: ["mail@mail.com"],
    job: "tech",
    phone: "0611223344",
  },
  createdAt: new Date(),
  expirationDate: addYears(new Date(), 1),
  rights: {
    searchEstablishment: {
      kinds: ["READ"],
      scope: "no-scope",
    },
    convention: {
      kinds: ["READ"],
      scope: {
        agencyIds: [],
      },
    },
  },
  description: "a",
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
    return new ApiConsumerBuilder({
      ...this.#dto,
      rights: {
        ...this.#dto.rights,
        convention: conventionRight,
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
