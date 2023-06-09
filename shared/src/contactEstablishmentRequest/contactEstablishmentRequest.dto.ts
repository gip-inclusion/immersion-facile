import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { RomeDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";

export type ContactInformations<T extends ContactMethod> = {
  offer: RomeDto;
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: T;
};

export type ContactEstablishmentByMailDto = ContactInformations<"EMAIL"> & {
  message: string;
  potentialBeneficiaryPhone: string;
  immersionObjective: string;
  potentialBeneficiaryCvOrLinkedin?: string;
};

export type ContactEstablishmentInPersonDto = ContactInformations<"IN_PERSON">;

export type ContactEstablishmentByPhoneDto = ContactInformations<"PHONE">;

export type ContactEstablishmentRequestDto =
  | ContactEstablishmentByPhoneDto
  | ContactEstablishmentInPersonDto
  | ContactEstablishmentByMailDto;
