import {
  AppellationCode,
  ContactMethod,
  Flavor,
  ImmersionObjective,
} from "shared";

type ExchangeRole = "establishment" | "potentialBeneficiary";

export type DiscussionId = Flavor<string, "DiscussionId">;

export type DiscussionAggregate = {
  id: DiscussionId;
  createdAt: Date;
  siret: string;
  appellationCode: AppellationCode;
  immersionObjective: ImmersionObjective | null;
  exchanges: ExchangeEntity[];
  potentialBeneficiary: {
    // emailUuid: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    resumeLink?: string;
  };
  establishmentContact: {
    // emailUuid: string;
    // firstName: string;
    // lastName: string;
    // email: string;
    // phone: string;
    // job: string;
    contactMode: ContactMethod;
  };
};

export type ExchangeEntity = {
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sentAt: Date;
};
