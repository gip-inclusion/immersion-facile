import {
  ContactEstablishmentRequestDto,
  ContactMethod,
  ImmersionObjective,
  RomeCode,
  SiretDto,
} from "shared";

type ContactInformationPublicV2<T extends ContactMethod> = {
  romeCode: RomeCode;
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: T;
};

type ContactEstablishmentByMailPublicV2Dto =
  ContactInformationPublicV2<"EMAIL"> & {
    message: string;
    potentialBeneficiaryPhone: string;
    immersionObjective: ImmersionObjective | null;
    potentialBeneficiaryResumeLink?: string;
  };

type ContactEstablishmentInPersonPublicV2Dto =
  ContactInformationPublicV2<"IN_PERSON">;

type ContactEstablishmentByPhonePublicV2Dto =
  ContactInformationPublicV2<"PHONE">;

export type ContactEstablishmentPublicV2Dto =
  | ContactEstablishmentByPhonePublicV2Dto
  | ContactEstablishmentInPersonPublicV2Dto
  | ContactEstablishmentByMailPublicV2Dto;

export const contactEstablishmentPublicV2ToDomain = (
  contactRequest: ContactEstablishmentPublicV2Dto,
): ContactEstablishmentRequestDto => contactRequest;
