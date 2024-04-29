import { Builder } from "../Builder";
import { Email } from "../email/email.dto";
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
  createdAt: new Date("2024-04-28T12:00:00.000Z").toISOString(),
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

  withExternalId(externalId: string): InclusionConnectedUserBuilder {
    return new InclusionConnectedUserBuilder({ ...this.#dto, externalId });
  }

  withId(id: UserId) {
    return new InclusionConnectedUserBuilder({ ...this.#dto, id });
  }

  withFirstName(firstName: string) {
    return new InclusionConnectedUserBuilder({ ...this.#dto, firstName });
  }

  withLastName(lastName: string) {
    return new InclusionConnectedUserBuilder({ ...this.#dto, lastName });
  }
  withEmail(email: Email) {
    return new InclusionConnectedUserBuilder({ ...this.#dto, email });
  }
}
