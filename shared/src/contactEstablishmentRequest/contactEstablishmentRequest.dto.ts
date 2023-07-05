import { ImmersionObjective } from "../convention/convention.dto";
import { DiscussionId } from "../discussion/discussion.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";

export type ContactInformations<T extends ContactMethod> = {
  appellationCode: AppellationCode;
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: T;
};

export type ContactEstablishmentByMailDto = ContactInformations<"EMAIL"> & {
  message: string;
  potentialBeneficiaryPhone: string;
  immersionObjective: ImmersionObjective | null;
  potentialBeneficiaryResumeLink?: string;
};

export type ContactEstablishmentInPersonDto = ContactInformations<"IN_PERSON">;

export type ContactEstablishmentByPhoneDto = ContactInformations<"PHONE">;

export type ContactEstablishmentRequestDto =
  | ContactEstablishmentByPhoneDto
  | ContactEstablishmentInPersonDto
  | ContactEstablishmentByMailDto;

export type ContactEstablishmentEventPayload = {
  discussionId: DiscussionId;
  message: string;
};
