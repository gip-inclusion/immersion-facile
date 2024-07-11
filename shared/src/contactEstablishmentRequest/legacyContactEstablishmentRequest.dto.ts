import { WithAcquisition } from "../acquisition.dto";
import { LocationId } from "../address/address.dto";
import { ImmersionObjective } from "../convention/convention.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";
import {
  ContactEstablishmentByPhoneDto,
  ContactEstablishmentInPersonDto,
} from "./contactEstablishmentRequest.dto";

type ContactInformations<T extends ContactMethod> = {
  appellationCode: AppellationCode;
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: T;
  locationId: LocationId;
} & WithAcquisition;

export type LegacyContactEstablishmentByMailDto =
  ContactInformations<"EMAIL"> & {
    message: string;
    potentialBeneficiaryPhone: string;
    immersionObjective: ImmersionObjective | null;
    potentialBeneficiaryResumeLink?: string;
  };

export type LegacyContactEstablishmentRequestDto =
  | ContactEstablishmentByPhoneDto
  | ContactEstablishmentInPersonDto
  | LegacyContactEstablishmentByMailDto;
