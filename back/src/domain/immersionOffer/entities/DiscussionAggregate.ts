import {
  AddressDto,
  AppellationCode,
  ContactMethod,
  Flavor,
  ImmersionObjective,
} from "shared";

type ExchangeRole = "establishment" | "potentialBeneficiary";

export type DiscussionId = Flavor<string, "DiscussionId">;

export type DiscussionPotentialBeneficiary = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  resumeLink?: string;
};

export type DiscussionEstablishmentContact = {
  email: string;
  copyEmails: string[];
  firstName: string;
  lastName: string;
  phone: string;
  job: string;
  contactMode: ContactMethod;
};

export type DiscussionAggregate = {
  id: DiscussionId;
  createdAt: Date;
  siret: string;
  appellationCode: AppellationCode;
  immersionObjective: ImmersionObjective | null;
  address: AddressDto;
  potentialBeneficiary: DiscussionPotentialBeneficiary;
  establishmentContact: DiscussionEstablishmentContact;
  exchanges: ExchangeEntity[];
};

export type ExchangeEntity = {
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sentAt: Date;
};
