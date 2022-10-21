import { ContactMethod, Flavor } from "shared";

type ExchangeRole = "establishment" | "potentialBeneficiary";

export type DiscussionId = Flavor<string, "DiscussionId">;

export type DiscussionAggregate = {
  id: DiscussionId;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  romeCode: string;
  siret: string;
  contactMode: ContactMethod;
  createdAt: Date;
  exchanges: ExchangeEntity[];
};

export type ExchangeEntity = {
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sentAt: Date;
};
