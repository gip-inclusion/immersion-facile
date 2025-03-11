import type { WithAcquisition } from "../acquisition.dto";
import type { LocationId } from "../address/address.dto";
import type { ImmersionObjective } from "../convention/convention.dto";
import type { DiscussionId } from "../discussion/discussion.dto";
import type { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import type { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";

export type ContactInformations<T extends ContactMethod> = {
  appellationCode: AppellationCode;
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: T;
  locationId: LocationId;
} & WithAcquisition;

export type ContactEstablishmentByMailDto = ContactInformations<"EMAIL"> & {
  potentialBeneficiaryPhone: string;
  immersionObjective: ImmersionObjective | null;
  potentialBeneficiaryResumeLink?: string;
  datePreferences: string;
  hasWorkingExperience: boolean;
  experienceAdditionalInformation?: string;
};

export type ContactEstablishmentInPersonDto = ContactInformations<"IN_PERSON">;

export type ContactEstablishmentByPhoneDto = ContactInformations<"PHONE">;

export type ContactEstablishmentRequestDto =
  | ContactEstablishmentByPhoneDto
  | ContactEstablishmentInPersonDto
  | ContactEstablishmentByMailDto;

export type ContactEstablishmentEventPayload = {
  discussionId: DiscussionId;
  siret: SiretDto;
  isLegacy?: boolean;
};
