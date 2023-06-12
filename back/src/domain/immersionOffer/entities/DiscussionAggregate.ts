import { ContactMethod, Flavor, ImmersionObjective } from "shared";

type ExchangeRole = "establishment" | "potentialBeneficiary";

export type DiscussionId = Flavor<string, "DiscussionId">;

export type DiscussionAggregate = {
  id: DiscussionId;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  potentialBeneficiaryPhone: string;
  potentialBeneficiaryResumeLink?: string;
  romeCode: string;
  siret: string;
  contactMode: ContactMethod;
  createdAt: Date;
  exchanges: ExchangeEntity[];
  immersionObjective: ImmersionObjective | null;
};

export type ExchangeEntity = {
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sentAt: Date;
};
