import { WithAcquisition } from "../acquisition.dto";
import { LocationId } from "../address/address.dto";
import { ImmersionObjective } from "../convention/convention.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";

type LegacyContactInformations<T extends ContactMethod> = {
  appellationCode: AppellationCode;
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: T;
  locationId: LocationId;
} & WithAcquisition;

export type LegacyContactEstablishmentByMailDto =
  LegacyContactInformations<"EMAIL"> & {
    message: string;
    potentialBeneficiaryPhone: string;
    immersionObjective: ImmersionObjective | null;
    potentialBeneficiaryResumeLink?: string;
  };

export type LegacyContactEstablishmentByPhoneDto =
  LegacyContactInformations<"PHONE">;

export type LegacyContactEstablishmentInPersonDto =
  LegacyContactInformations<"IN_PERSON">;

export type LegacyContactEstablishmentRequestDto =
  | LegacyContactEstablishmentByPhoneDto
  | LegacyContactEstablishmentInPersonDto
  | LegacyContactEstablishmentByMailDto;
