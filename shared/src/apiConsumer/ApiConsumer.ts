import type { AgencyId, AgencyKind } from "../agency/agency.dto";
import type { Email } from "../email/email.dto";
import { Flavor } from "../typeFlavors";
import { Either } from "../utils";
import { DateIsoString } from "../utils/date";

export type ApiConsumerId = Flavor<string, "ApiConsumerId">;

export type ApiConsumerJwtPayload = {
  id: ApiConsumerId;
};

export type ApiConsumerName = Flavor<string, "ApiConsumerName">;

export type ApiConsumerKind = (typeof apiConsumerKinds)[number];
export const apiConsumerKinds = ["READ", "WRITE"] as const;

type ApiConsumerRight<Scope> = {
  kinds: ApiConsumerKind[];
  scope: Scope;
};

type ApiConsumerRightName = (typeof apiConsumerRightNames)[number];
export const apiConsumerRightNames = [
  "searchEstablishment",
  "convention",
] as const;
export type ApiConsumerRights = {
  searchEstablishment: ApiConsumerRight<NoScope>;
  convention: ApiConsumerRight<ConventionScope>;
};

export type NoScope = "no-scope";

export type ConventionScope = Either<
  { agencyKinds: AgencyKind[] },
  { agencyIds: AgencyId[] }
>;

export type ApiConsumer = {
  id: ApiConsumerId;
  consumer: ApiConsumerName;
  contact: ApiConsumerContact;
  description?: string;
  rights: ApiConsumerRights;
  createdAt: DateIsoString;
  expirationDate: DateIsoString;
};

export type ApiConsumerContact = {
  lastName: string;
  firstName: string;
  job: string;
  phone: string;
  emails: Email[];
};

export const isApiConsumerAllowed = ({
  apiConsumer,
  rightName,
  consumerKind,
}: {
  apiConsumer: ApiConsumer | undefined;
  rightName: ApiConsumerRightName;
  consumerKind: ApiConsumerKind;
}): boolean =>
  !!apiConsumer && apiConsumer.rights[rightName].kinds.includes(consumerKind);
