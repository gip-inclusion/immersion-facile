import { AddressDto } from "../address/address.dto";
import { ImmersionObjective } from "../convention/convention.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";
import { includesTypeGuard } from "../typeGuard";
import { OmitFromExistingKeys } from "../utils";
import { DateString } from "../utils/date";

export const exchangeRoles = ["establishment", "potentialBeneficiary"] as const;
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

type DiscussionDtoBase = {
  id: DiscussionId;
  createdAt: DateString;
  siret: SiretDto;
  businessName: string;
  appellationCode: AppellationCode;
  immersionObjective: ImmersionObjective | null;
  address: AddressDto;
  exchanges: Exchange[];
};

export type DiscussionDto = DiscussionDtoBase & {
  potentialBeneficiary: DiscussionPotentialBeneficiary;
  establishmentContact: DiscussionEstablishmentContact;
};

export type DiscussionReadDto = DiscussionDtoBase & {
  potentialBeneficiary: OmitFromExistingKeys<
    DiscussionPotentialBeneficiary,
    "email" | "phone"
  >;
  establishmentContact: OmitFromExistingKeys<
    DiscussionEstablishmentContact,
    "email" | "copyEmails" | "phone"
  >;
};

export type Exchange = {
  subject: string;
  message: string;
  sender: ExchangeRole;
  recipient: ExchangeRole;
  sentAt: DateString;
};
