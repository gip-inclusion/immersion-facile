import { Builder } from "../Builder";
import { Email } from "../email/email.dto";
import {
  AgencyRight,
  InclusionConnectedUser,
  UserId,
  UserWithAdminRights,
  WithEstablismentsSiretAndName,
} from "./inclusionConnectedAllowed.dto";

const defaultInclusionConnectedUser: InclusionConnectedUser = {
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
  #dto: InclusionConnectedUser = defaultInclusionConnectedUser;

  constructor(dto = defaultInclusionConnectedUser) {
    this.#dto = dto;
  }

  build() {
    return this.#dto;
  }

  buildUser(): UserWithAdminRights {
    const {
      agencyRights: _,
      establishments: __,
      dashboards: ____,
      ...user
    } = this.#dto;
    return user;
  }

  buildAgencyRights(): AgencyRight[] {
    return this.#dto.agencyRights;
  }

  withCreatedAt(createdAt: Date): InclusionConnectedUserBuilder {
    return new InclusionConnectedUserBuilder({
      ...this.#dto,
      createdAt: createdAt.toISOString(),
    });
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

  withAgencyRights(agencyRights: AgencyRight[]) {
    return new InclusionConnectedUserBuilder({ ...this.#dto, agencyRights });
  }

  withEstablishments(
    establishments: WithEstablismentsSiretAndName[] | undefined,
  ) {
    return new InclusionConnectedUserBuilder({ ...this.#dto, establishments });
  }
}
