import type { WithAcquisition } from "../acquisition.dto";
import type { LocationId } from "../address/address.dto";
import type {
  discoverObjective,
  ImmersionObjective,
  LevelOfEducation,
} from "../convention/convention.dto";
import type {
  DiscussionId,
  DiscussionKind,
} from "../discussion/discussion.dto";
import type { ContactMode } from "../formEstablishment/FormEstablishment.dto";
import type { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";

export const contactLevelsOfEducation = [
  "3ème",
  "2nde",
] as const satisfies Extract<LevelOfEducation, "3ème" | "2nde">[];

export type ContactLevelOfEducation = (typeof contactLevelsOfEducation)[number];

export const labelsForContactLevelOfEducation: Record<
  ContactLevelOfEducation,
  string
> = {
  "3ème": "Troisième",
  "2nde": "Seconde",
};

export type ContactInformations<
  T extends ContactMode,
  D extends DiscussionKind,
> = {
  appellationCode: AppellationCode;
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: T;
  kind: D;
  locationId: LocationId;
} & WithAcquisition &
  (D extends "1_ELEVE_1_STAGE"
    ? { levelOfEducation: ContactLevelOfEducation }
    : // biome-ignore lint/complexity/noBannedTypes: we need {} here
      {});

type ContactEstablishmentByMailCommon = {
  potentialBeneficiaryPhone: string;
  datePreferences: string;
};

export type ContactEstablishmentByMailIFDto = ContactInformations<
  "EMAIL",
  "IF"
> &
  ContactEstablishmentByMailCommon & {
    immersionObjective: ImmersionObjective | null;
    hasWorkingExperience: boolean;
    experienceAdditionalInformation?: string;
    potentialBeneficiaryResumeLink?: string;
  };

export type ContactEstablishmentByMail1Eleve1StageDto = ContactInformations<
  "EMAIL",
  "1_ELEVE_1_STAGE"
> &
  ContactEstablishmentByMailCommon & {
    immersionObjective: Extract<ImmersionObjective, typeof discoverObjective>;
  };

type ContactEstablishmentInPersonIfDto = ContactInformations<"IN_PERSON", "IF">;
type ContactEstablishmentInPerson1Eleve1StageDto = ContactInformations<
  "IN_PERSON",
  "1_ELEVE_1_STAGE"
>;
type ContactEstablishmentByPhoneIfDto = ContactInformations<"PHONE", "IF">;
export type ContactEstablishmentByPhone1Eleve1StageDto = ContactInformations<
  "PHONE",
  "1_ELEVE_1_STAGE"
>;

export type ContactEstablishmentByMailDto =
  | ContactEstablishmentByMailIFDto
  | ContactEstablishmentByMail1Eleve1StageDto;

export type ContactEstablishmentInPersonDto =
  | ContactEstablishmentInPersonIfDto
  | ContactEstablishmentInPerson1Eleve1StageDto;

export type ContactEstablishmentByPhoneDto =
  | ContactEstablishmentByPhoneIfDto
  | ContactEstablishmentByPhone1Eleve1StageDto;

export type ContactEstablishmentRequestDto =
  | ContactEstablishmentByPhoneDto
  | ContactEstablishmentInPersonDto
  | ContactEstablishmentByMailDto;

export type ContactEstablishment1Eleve1StageDto =
  | ContactEstablishmentByMail1Eleve1StageDto
  | ContactEstablishmentByPhone1Eleve1StageDto
  | ContactEstablishmentInPerson1Eleve1StageDto;

export type ContactEstablishmentIFDto =
  | ContactEstablishmentByMailIFDto
  | ContactEstablishmentByPhoneIfDto
  | ContactEstablishmentInPersonIfDto;

export type ContactEstablishmentEventPayload = {
  discussionId: DiscussionId;
  siret: SiretDto;
  isLegacy?: boolean;
};
