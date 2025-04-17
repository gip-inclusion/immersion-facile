import type { WithAcquisition } from "../acquisition.dto";
import type { LocationId } from "../address/address.dto";
import type {
  ImmersionObjective,
  LevelOfEducation,
  discoverObjective,
} from "../convention/convention.dto";
import type { DiscussionId } from "../discussion/discussion.dto";
import type {
  ContactMethod,
  DiscussionKind,
} from "../formEstablishment/FormEstablishment.dto";
import type { AppellationCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";

// discussionKind, si "1eleve1stage" -> ajouter "levelOfEducation"
// mail: forcer immersionObjective à "Découverte d'un métier", hasWorkingExperience = false, pas de experienceAdditionalInformation

export type ContactLevelOfEducation = Extract<
  LevelOfEducation,
  "3ème" | "2nde"
>;

export type ContactInformations<
  T extends ContactMethod,
  D extends DiscussionKind,
> = {
  appellationCode: AppellationCode;
  siret: SiretDto;
  potentialBeneficiaryFirstName: string;
  potentialBeneficiaryLastName: string;
  potentialBeneficiaryEmail: string;
  contactMode: T;
  discussionKind: D;
  locationId: LocationId;
} & WithAcquisition &
  (D extends "1_ELEVE_1_STAGE"
    ? { levelOfEducation: ContactLevelOfEducation }
    : // biome-ignore lint/complexity/noBannedTypes: we need {} here
      {});

export type ContactEstablishmentByMailDto =
  | ContactEstablishmentByMailIFDto
  | ContactEstablishmentByMail1Eleve1StageDto;

type ContactEstablishmentByMailCommon = {
  potentialBeneficiaryPhone: string;
  potentialBeneficiaryResumeLink?: string;
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
  };

export type ContactEstablishmentByMail1Eleve1StageDto = ContactInformations<
  "EMAIL",
  "1_ELEVE_1_STAGE"
> &
  ContactEstablishmentByMailCommon & {
    immersionObjective: Extract<ImmersionObjective, typeof discoverObjective>;
  };

export type ContactEstablishmentInPersonDto =
  | ContactInformations<"IN_PERSON", "IF">
  | ContactInformations<"IN_PERSON", "1_ELEVE_1_STAGE">;

export type ContactEstablishmentByPhoneDto =
  | ContactInformations<"PHONE", "IF">
  | ContactInformations<"PHONE", "1_ELEVE_1_STAGE">;

export type ContactEstablishmentRequestDto =
  | ContactEstablishmentByPhoneDto
  | ContactEstablishmentInPersonDto
  | ContactEstablishmentByMailDto;

export type ContactEstablishmentEventPayload = {
  discussionId: DiscussionId;
  siret: SiretDto;
  isLegacy?: boolean;
};
