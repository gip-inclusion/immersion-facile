import { AddressDto } from "../address/address.dto";
import { ImmersionObjective } from "../convention/convention.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { Flavor } from "../typeFlavors";
import { includesTypeGuard } from "../typeGuard";

const exchangeRoles = ["establishment", "potentialBeneficiary"] as const;
export type ExchangeRole = (typeof exchangeRoles)[number];
export const isExchangeRole = includesTypeGuard(exchangeRoles);

export type DiscussionId = Flavor<string, "DiscussionId">;

export type DiscussionPotentialBeneficiary = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  resumeLink?: string;
};

export type DiscussionEstablishmentContact = {
  email: string;
  copyEmails: string[];
  firstName: string;
  lastName: string;
  phone: string;
  job: string;
  contactMethod: ContactMethod;
};

export type DiscussionDto = {
  id: DiscussionId;
  createdAt: Date;
  siret: string;
  businessName: string;
  appellationCode: AppellationCode;
  immersionObjective: ImmersionObjective | null;
  address: AddressDto;
  potentialBeneficiary: DiscussionPotentialBeneficiary;
  establishmentContact: DiscussionEstablishmentContact;
  exchanges: Exchange[];
};

export type Exchange = {
  subject: string;
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sentAt: Date;
};
