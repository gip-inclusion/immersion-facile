import { AbsoluteUrl } from "../AbsoluteUrl";
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
export const apiConsumerKinds = ["READ", "WRITE", "SUBSCRIPTION"] as const;

export type SubscriptionParams = {
  callbackUrl: AbsoluteUrl;
  callbackHeaders: CallbackHeaders;
};

export type ApiConsumerRight<
  Scope,
  R extends ApiConsumerRightName,
  Event extends string = never,
> = {
  kinds: ApiConsumerKind[];
  scope: Scope;
  subscriptions?: Record<SubscriptionName<R, Event>, SubscriptionParams>;
};

export type SubscriptionName<
  R extends ApiConsumerRightName,
  Event extends string = never,
> = `${R}.${Event}`;

type ApiConsumerRightName = (typeof apiConsumerRightNames)[number];
export const apiConsumerRightNames = [
  "searchEstablishment",
  "convention",
] as const;
export type ApiConsumerRights = {
  searchEstablishment: ApiConsumerRight<NoScope, "searchEstablishment">;
  convention: ApiConsumerRight<ConventionScope, "convention", "updated">;
};

export type WebhookSubscription = SubscriptionParams & {
  subscribedEvent: SubscriptionEvent;
};

export type SubscriptionEvent = SubscriptionName<"convention", "updated">;

export type NoScope = "no-scope";

export const conventionScopeKeys = ["agencyKinds", "agencyIds"] as const;
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

export type CallbackHeaders = {
  authorization: string;
};

export const eventToRightName = (
  event: SubscriptionEvent,
): ApiConsumerRightName => {
  const strategy: Record<SubscriptionEvent, ApiConsumerRightName> = {
    "convention.updated": "convention",
  };
  return strategy[event];
};
