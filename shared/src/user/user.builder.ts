import type { AgencyRight } from "../agency/agency.dto";
import type { ProConnectInfos } from "../auth/proConnect/proConnect.dto";
import type { Builder } from "../Builder";
import type { Email } from "../email/email.dto";
import type { EstablishmentData } from "../establishment/establishment";
import type {
  ConnectedUser,
  User,
  UserId,
  UserWithAdminRights,
} from "./user.dto";

const defaultUser: User = {
  id: "default-user-id",
  email: "default.user@mail.com",
  firstName: "Default",
  lastName: "User",
  createdAt: new Date("2024-04-28T12:00:00.000Z").toISOString(),
  proConnect: null,
};

export const defaultProConnectInfos: ProConnectInfos = {
  externalId: "default-external-id",
  siret: "11111222223333",
};

const defaultConnectedUser: ConnectedUser = {
  id: "default-inclusion-connect-user-id",
  email: "default.user@mail.com",
  firstName: "Default",
  lastName: "User",
  proConnect: defaultProConnectInfos,
  createdAt: new Date("2024-04-28T12:00:00.000Z").toISOString(),
  agencyRights: [],
  dashboards: { agencies: {}, establishments: {} },
  establishments: [],
  isBackofficeAdmin: false,
};

export class UserBuilder implements Builder<User> {
  #dto: User = defaultUser;

  constructor(dto = defaultUser) {
    this.#dto = dto;
  }

  withId(id: UserId) {
    return new UserBuilder({ ...this.#dto, id });
  }

  withProConnectInfos(proConnect: ProConnectInfos | null) {
    return new UserBuilder({ ...this.#dto, proConnect });
  }

  withFirstName(firstName: string) {
    return new UserBuilder({ ...this.#dto, firstName });
  }

  withLastName(lastName: string) {
    return new UserBuilder({ ...this.#dto, lastName });
  }

  withEmail(email: Email) {
    return new UserBuilder({ ...this.#dto, email });
  }

  withCreatedAt(date: Date) {
    return new UserBuilder({ ...this.#dto, createdAt: date.toISOString() });
  }

  build() {
    return this.#dto;
  }
}

export class ConnectedUserBuilder implements Builder<ConnectedUser> {
  #dto: ConnectedUser = defaultConnectedUser;

  constructor(dto = defaultConnectedUser) {
    this.#dto = dto;
  }

  build() {
    return this.#dto;
  }

  buildUser(): UserWithAdminRights {
    const { agencyRights: _, dashboards: ____, ...user } = this.#dto;
    return user;
  }

  buildAgencyRights(): AgencyRight[] {
    return this.#dto.agencyRights;
  }

  withCreatedAt(createdAt: Date): ConnectedUserBuilder {
    return new ConnectedUserBuilder({
      ...this.#dto,
      createdAt: createdAt.toISOString(),
    });
  }

  withIsAdmin(isBackofficeAdmin: boolean): ConnectedUserBuilder {
    return new ConnectedUserBuilder({
      ...this.#dto,
      isBackofficeAdmin,
    });
  }

  withProConnectInfos(
    proConnect: ProConnectInfos | null,
  ): ConnectedUserBuilder {
    return new ConnectedUserBuilder({ ...this.#dto, proConnect });
  }

  withId(id: UserId) {
    return new ConnectedUserBuilder({ ...this.#dto, id });
  }

  withFirstName(firstName: string) {
    return new ConnectedUserBuilder({ ...this.#dto, firstName });
  }

  withLastName(lastName: string) {
    return new ConnectedUserBuilder({ ...this.#dto, lastName });
  }
  withEmail(email: Email) {
    return new ConnectedUserBuilder({ ...this.#dto, email });
  }

  withAgencyRights(agencyRights: AgencyRight[]) {
    return new ConnectedUserBuilder({ ...this.#dto, agencyRights });
  }

  withEstablishments(establishments: EstablishmentData[] | undefined) {
    return new ConnectedUserBuilder({ ...this.#dto, establishments });
  }
}
