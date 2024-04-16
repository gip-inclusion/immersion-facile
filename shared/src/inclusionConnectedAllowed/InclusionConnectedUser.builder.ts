import { Builder } from "../Builder";
import {
  InclusionConnectedUser,
  UserId,
} from "./inclusionConnectedAllowed.dto";

const defaultInculsionConnectUser: InclusionConnectedUser = {
  id: "default-inclusion-connect-user-id",
  email: "default.user@mail.com",
  firstName: "Default",
  lastName: "User",
  externalId: "default-external-id",
  createdAt: new Date().toISOString(),
  agencyRights: [],
  dashboards: { agencies: {}, establishments: {} },
  establishments: [],
  isBackofficeAdmin: false,
};

export class InclusionConnectedUserBuilder
  implements Builder<InclusionConnectedUser>
{
  #dto: InclusionConnectedUser = defaultInculsionConnectUser;

  constructor(dto = defaultInculsionConnectUser) {
    this.#dto = dto;
  }

  build() {
    return this.#dto;
  }

  withIsAdmin(isBackofficeAdmin: boolean): InclusionConnectedUserBuilder {
    return new InclusionConnectedUserBuilder({
      ...this.#dto,
      isBackofficeAdmin,
    });
  }

  withId(id: UserId) {
    return new InclusionConnectedUserBuilder({ ...this.#dto, id });
  }
}
