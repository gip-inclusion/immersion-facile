import { AgencyId } from "../agency/agency.dto";
import { Email } from "../email/email.dto";
import { PeConnectIdentity } from "../federatedIdentities/federatedIdentity.dto";
import {
  allSignatoryRoles,
  ModifierRole,
  Role,
  SignatoryRole,
} from "../role/role.dto";
import { AppellationAndRomeDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { ScheduleDto } from "../schedule/Schedule.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";

export type ConventionStatus = (typeof conventionStatuses)[number];

export const isBeneficiary = (
  beneficiary: Beneficiary<InternshipKind>,
): beneficiary is Beneficiary<"immersion"> =>
  !("levelOfEducation" in beneficiary);

export const isBeneficiaryStudent = (
  beneficiary: Beneficiary<InternshipKind>,
): beneficiary is Beneficiary<"mini-stage-cci"> =>
  "levelOfEducation" in beneficiary;

type ConventionStatusWithoutJustificationNorValidator =
  (typeof conventionStatusesWithoutJustificationNorValidator)[number];

export const conventionStatusesWithoutJustificationNorValidator = [
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "IN_REVIEW",
] as const;

export const doesStatusNeedsJustification = (
  status: ConventionStatus,
): status is ConventionStatusWithJustification =>
  conventionStatusesWithJustification.includes(
    status as ConventionStatusWithJustification,
  );

export const doesStatusNeedsValidators = (
  initialStatus: ConventionStatus,
  targetStatus: ConventionStatus,
): boolean => {
  const isValidatorRequired = conventionStatusesWithValidator.includes(
    targetStatus as ConventionStatusWithValidator,
  );
  return isValidatorRequired && initialStatus === "IN_REVIEW";
};

export const conventionStatusesWithJustificationWithoutModifierRole = [
  "REJECTED",
  "CANCELLED",
  "DEPRECATED",
] as const;

export const conventionStatusesWithJustificationWithModifierRole = [
  "DRAFT",
] as const;

export type ConventionStatusWithJustification =
  (typeof conventionStatusesWithJustification)[number];
export const conventionStatusesWithJustification = [
  ...conventionStatusesWithJustificationWithoutModifierRole,
  ...conventionStatusesWithJustificationWithModifierRole,
] as const;
export type ConventionStatusWithValidator =
  (typeof conventionStatusesWithValidator)[number];
export const conventionStatusesWithValidator = [
  "ACCEPTED_BY_COUNSELLOR",
  "ACCEPTED_BY_VALIDATOR",
] as const;

export const conventionStatuses = [
  ...conventionStatusesWithoutJustificationNorValidator,
  ...conventionStatusesWithJustification,
  ...conventionStatusesWithValidator,
] as const;

export const maximumCalendarDayByInternshipKind: Record<
  InternshipKind,
  number
> = {
  immersion: 30,
  "mini-stage-cci": 5,
};
export const IMMERSION_BENEFICIARY_MINIMUM_AGE_REQUIREMENT = 16;
export const MINI_STAGE_CCI_BENEFICIARY_MINIMUM_AGE_REQUIREMENT = 10;
export const CCI_WEEKLY_LIMITED_SCHEDULE_HOURS = 30;
export const CCI_WEEKLY_LIMITED_SCHEDULE_AGE = 16;

export const validatedConventionStatuses: ConventionStatus[] = [
  "ACCEPTED_BY_VALIDATOR",
];

export type ConventionId = Flavor<string, "ConventionId">;
export type ConventionExternalId = Flavor<string, "ConventionExternalId">;

export const conventionObjectiveOptions = [
  "Confirmer un projet professionnel",
  "Découvrir un métier ou un secteur d'activité",
  "Initier une démarche de recrutement",
] as const;

export type ImmersionObjective = (typeof conventionObjectiveOptions)[number];

export const internshipKinds = ["immersion", "mini-stage-cci"] as const;
export type InternshipKind = (typeof internshipKinds)[number];

export type ConventionCommon = {
  id: ConventionId;
  status: ConventionStatus;
  statusJustification?: string;
  agencyId: AgencyId;
  dateSubmission: string; // Date iso string
  dateStart: string; // Date iso string
  dateEnd: string; // Date iso string
  dateValidation?: string; // Date iso string (undefined until the convention is validated)
  siret: SiretDto;
  businessName: string;
  schedule: ScheduleDto;
  workConditions?: string;
  businessAdvantages?: string;
  individualProtection: boolean;
  sanitaryPrevention: boolean;
  sanitaryPreventionDescription: string;
  immersionAddress: string;
  immersionObjective: ImmersionObjective;
  immersionAppellation: AppellationAndRomeDto;
  immersionActivities: string;
  immersionSkills: string;
  establishmentTutor: EstablishmentTutor;
};

export type ConventionInternshipKindSpecific<T extends InternshipKind> = {
  internshipKind: T;
  signatories: Signatories<T>;
};

export type ConventionDtoWithoutExternalId = ConventionCommon &
  (
    | ConventionInternshipKindSpecific<"immersion">
    | ConventionInternshipKindSpecific<"mini-stage-cci">
  );

export type Signatories<T extends InternshipKind = InternshipKind> = {
  beneficiary: Beneficiary<T>;
  establishmentRepresentative: EstablishmentRepresentative;
  beneficiaryRepresentative?: BeneficiaryRepresentative;
  beneficiaryCurrentEmployer?: BeneficiaryCurrentEmployer;
};

export const isSignatoryRole = (role: Role): role is SignatoryRole =>
  allSignatoryRoles.includes(role as SignatoryRole);

export type Signatory = GenericSignatory<SignatoryRole>;

export type GenericActor<R extends Role> = {
  role: R;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
};

export type GenericSignatory<R extends Role> = GenericActor<R> & {
  signedAt?: string; // Date iso string
};

type StudentProperties = {
  levelOfEducation: LevelOfEducation;
};

/* eslint-disable @typescript-eslint/ban-types */
//prettier-ignore
export type Beneficiary<T extends InternshipKind> =
  GenericSignatory<"beneficiary"> & {
  emergencyContact?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: Email;
  federatedIdentity?: PeConnectIdentity;
  financiaryHelp?: string;
  birthdate: string; // Date iso string
  isRqth?: boolean;
}
  & (T extends "mini-stage-cci" ? StudentProperties : {});
/* eslint-enable @typescript-eslint/ban-types */

export type LevelOfEducation = (typeof levelsOfEducation)[number];

export const levelsOfEducation = [
  "4ème",
  "3ème",
  "2nde",
  "1ère",
  "Terminale",
  "Etude supérieure 1ère année",
  "Etude supérieure 2ème année",
  "Etude supérieure 3ème année",
  "Etude supérieure 4ème année",
  "Etude supérieure 5ème année",
  "Etude supérieure 6ème année",
  "Etude supérieure 7ème année",
  "Etude supérieure 8ème année",
] as const;

export type BeneficiaryRepresentative =
  GenericSignatory<"beneficiary-representative">;

export type BeneficiaryCurrentEmployer =
  GenericSignatory<"beneficiary-current-employer"> & {
    job: string;
    businessSiret: string;
    businessName: string;
    businessAddress: string;
  };

export type EstablishmentRepresentative =
  GenericSignatory<"establishment-representative">;

export type EstablishmentTutor = GenericActor<"establishment-tutor"> & {
  job: string;
};

export type ConventionDto = ConventionDtoWithoutExternalId & {
  externalId: ConventionExternalId;
};

export type ConventionReadDto = ConventionDto & {
  agencyName: string;
  agencyDepartment: string;
};

export type WithConventionIdLegacy = {
  id: ConventionId;
};

export type WithConventionId = {
  conventionId: ConventionId;
};

export type UpdateConventionRequestDto = {
  convention: ConventionDto;
};

export type ListConventionsRequestDto = {
  agencyId?: string;
  status?: ConventionStatus;
};

export type UpdateConventionStatusWithValidator = {
  status: ConventionStatusWithValidator;
  conventionId: ConventionId;
  lastname?: string;
  firstname?: string;
};

export type UpdateConventionStatusWithoutJustification = {
  status: ConventionStatusWithoutJustificationNorValidator;
  conventionId: ConventionId;
};

export type UpdateConventionStatusWithJustificationWithoutModierRole = {
  status: Exclude<ConventionStatusWithJustification, "DRAFT">;
  conventionId: ConventionId;
  statusJustification: string;
};

export type UpdateConventionStatusWithJustificationWithModifierRole = {
  status: Extract<ConventionStatusWithJustification, "DRAFT">;
  conventionId: ConventionId;
  statusJustification: string;
  modifierRole: ModifierRole;
};

export type UpdateConventionStatusWithJustification =
  | UpdateConventionStatusWithJustificationWithoutModierRole
  | UpdateConventionStatusWithJustificationWithModifierRole;

export type UpdateConventionStatusRequestDto =
  | UpdateConventionStatusWithoutJustification
  | UpdateConventionStatusWithJustification
  | UpdateConventionStatusWithValidator;
// prettier-ignore
const _isAssignable = (isValid: UpdateConventionStatusRequestDto): { status: ConventionStatus } => isValid;

export type GenerateMagicLinkRequestDto = {
  applicationId: ConventionId;
  role: Role;
  expired: boolean;
};

export type GenerateMagicLinkResponseDto = {
  jwt: string;
};

export type RenewMagicLinkRequestDto = {
  originalUrl: string;
  expiredJwt: string;
};
