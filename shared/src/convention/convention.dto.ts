import { differenceInYears, startOfDay } from "date-fns";
import { keys } from "ramda";
import type { WithAcquisition } from "../acquisition.dto";
import type { AddressDto, Postcode } from "../address/address.dto";
import type { AgencyId, AgencyKind } from "../agency/agency.dto";
import type { Email } from "../email/email.dto";
import type { FtConnectIdentity } from "../federatedIdentities/federatedIdentity.dto";
import type { DateFilter } from "../filters";
import type {
  AgencyRole,
  UserWithAdminRights,
  UserWithAgencyRights,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import type { PaginationQueryParams } from "../pagination/pagination.dto";
import {
  type Role,
  type SignatoryRole,
  allSignatoryRoles,
} from "../role/role.dto";
import type {
  AppellationAndRomeDto,
  AppellationCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { ScheduleDto } from "../schedule/Schedule.dto";
import type { NumberEmployeesRange, SiretDto } from "../siret/siret";
import type {
  AppSupportedJwt,
  expiredMagicLinkErrorMessage,
} from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";
import type { NotEmptyArray } from "../utils";
import type { DateString } from "../utils/date";

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
  status: ConventionStatus | null,
): status is ConventionStatusWithJustification =>
  conventionStatusesWithJustification.includes(
    status as ConventionStatusWithJustification,
  );

export const doesStatusNeedsValidators = (
  initialStatus: ConventionStatus,
  targetStatus: ConventionStatus | null,
): targetStatus is ConventionStatusWithValidator => {
  const isValidatorRequired = conventionStatusesWithValidator.includes(
    targetStatus as ConventionStatusWithValidator,
  );
  return (
    isValidatorRequired &&
    (initialStatus === "IN_REVIEW" ||
      initialStatus === "ACCEPTED_BY_COUNSELLOR")
  );
};

export const conventionStatusesAllowedForModification: ConventionStatus[] = [
  "IN_REVIEW",
  "PARTIALLY_SIGNED",
  "READY_TO_SIGN",
] as const;

export type ConventionStatusWithJustification =
  (typeof conventionStatusesWithJustification)[number];
export const conventionStatusesWithJustification = [
  "REJECTED",
  "CANCELLED",
  "DEPRECATED",
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

export const maxPresenceDaysByInternshipKind: Record<InternshipKind, number> = {
  immersion: 30,
  "mini-stage-cci": 5,
};

export const maximumCalendarDayByInternshipKind: Record<
  InternshipKind,
  number
> = {
  immersion: 30,
  "mini-stage-cci": 8,
};

export const DATE_CONSIDERED_OLD = new Date("2024-08-31");

export const BENEFICIARY_MAXIMUM_AGE_REQUIREMENT = 120;
export const IMMERSION_BENEFICIARY_MINIMUM_AGE_REQUIREMENT = 16;
export const MINI_STAGE_CCI_BENEFICIARY_MINIMUM_AGE_REQUIREMENT = 10;
export const IMMERSION_WEEKLY_LIMITED_SCHEDULE_HOURS = 48;
export const CCI_WEEKLY_LIMITED_SCHEDULE_HOURS = 30;
export const CCI_WEEKLY_LIMITED_SCHEDULE_AGE = 15;
export const CCI_WEEKLY_MAX_PERMITTED_HOURS = 35;
export const CCI_WEEKLY_MAX_PERMITTED_HOURS_RELEASE_DATE = new Date(
  "2023-12-22",
);

export const MAX_PRESENCE_DAYS_RELEASE_DATE = new Date("2025-03-27");
export const SIGNATORIES_PHONE_NUMBER_DISTINCT_RELEASE_DATE = new Date(
  "2025-04-30",
);

export const validatedConventionStatuses: ConventionStatus[] = [
  "ACCEPTED_BY_VALIDATOR",
];

export const reviewedConventionStatuses: ConventionStatus[] = [
  "ACCEPTED_BY_COUNSELLOR",
];

export type ConventionId = Flavor<string, "ConventionId">;
export type ConventionExternalId = Flavor<string, "ConventionExternalId">;

export const discoverObjective = "Découvrir un métier ou un secteur d'activité";
export const conventionObjectiveOptions = [
  "Confirmer un projet professionnel",
  "Initier une démarche de recrutement",
  discoverObjective,
] as const;

export type ImmersionObjective = (typeof conventionObjectiveOptions)[number];

export const internshipKinds = ["immersion", "mini-stage-cci"] as const;
export type InternshipKind = (typeof internshipKinds)[number];

export type ConventionCommon = {
  id: ConventionId;
  status: ConventionStatus;
  statusJustification?: string;
  agencyId: AgencyId;
  dateSubmission: DateString;
  dateStart: DateString;
  dateEnd: DateString;
  dateValidation?: DateString; // undefined until the convention is validated
  dateApproval?: DateString; // undefined until the convention is accepted by counsellor
  updatedAt?: DateString;
  siret: SiretDto;
  businessName: string;
  schedule: ScheduleDto;
  workConditions?: string;
  businessAdvantages?: string;
  individualProtection: boolean;
  individualProtectionDescription: string;
  sanitaryPrevention: boolean;
  sanitaryPreventionDescription: string;
  immersionAddress: string;
  immersionObjective: ImmersionObjective;
  immersionAppellation: AppellationAndRomeDto;
  immersionActivities: string;
  immersionSkills: string;
  establishmentNumberEmployeesRange?: NumberEmployeesRange;
  establishmentTutor: EstablishmentTutor;
  validators?: ConventionValidatorInputNames;
} & Partial<WithRenewed> &
  WithAcquisition;

export type ConventionRenewed = ConventionDto & WithRenewed;

export type Renewed = {
  from: ConventionId;
  justification: string;
};

export type WithRenewed = {
  renewed: Renewed;
};

export type ConventionValidatorInputNames = {
  agencyCounsellor?: ConventionValidatorInputName;
  agencyValidator?: ConventionValidatorInputName;
};

export type ConventionValidatorInputName = {
  firstname?: string;
  lastname?: string;
};

export type ConventionInternshipKindSpecific<T extends InternshipKind> = {
  internshipKind: T;
  signatories: Signatories<T>;
};

export type ConventionDto = ConventionCommon &
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
  schoolName: string;
  schoolPostcode: Postcode;
  address?: AddressDto;
};

export type Beneficiary<T extends InternshipKind> =
  GenericSignatory<"beneficiary"> & {
    emergencyContact?: string;
    emergencyContactPhone?: string;
    emergencyContactEmail?: Email;
    federatedIdentity?: FtConnectIdentity;
    financiaryHelp?: string;
    birthdate: string; // Date iso string
    isRqth?: boolean;
    // biome-ignore lint/complexity/noBannedTypes: we need {} here
  } & (T extends "mini-stage-cci" ? StudentProperties : {});

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

export type AgencyRefersToInConvention = {
  id: AgencyId;
  name: string;
  kind: AgencyKind;
};

export type ConventionAgencyFields = {
  agencyName: string;
  agencyDepartment: string;
  agencyKind: AgencyKind;
  agencySiret: SiretDto;
  agencyCounsellorEmails: string[];
  agencyValidatorEmails: string[];
  agencyRefersTo?: AgencyRefersToInConvention;
};

export type ConventionReadDto = ConventionDto & ConventionAgencyFields;

export type WithConventionIdLegacy = {
  id: ConventionId;
};

export type WithConventionId = {
  conventionId: ConventionId;
};
export type WithConventionDto = {
  convention: ConventionDto;
};

export type SendSignatureLinkRequestDto = WithConventionId & {
  signatoryRole: SignatoryRole;
};

export type TransferConventionToAgencyRequestDto = WithConventionId & {
  agencyId: AgencyId;
  justification: string;
};

export type UpdateConventionRequestDto = {
  convention: ConventionDto;
};

export type UpdateConventionStatusWithValidator = {
  status: ConventionStatusWithValidator;
  conventionId: ConventionId;
  lastname: string;
  firstname: string;
};

export type UpdateConventionStatusWithoutJustification = {
  status: ConventionStatusWithoutJustificationNorValidator;
  conventionId: ConventionId;
};

export type UpdateConventionStatusWithJustification = {
  status: ConventionStatusWithJustification;
  conventionId: ConventionId;
  statusJustification: string;
};

export type UpdateConventionStatusRequestDto =
  | UpdateConventionStatusWithoutJustification
  | UpdateConventionStatusWithJustification
  | UpdateConventionStatusWithValidator;

const _isAssignable = (
  isValid: UpdateConventionStatusRequestDto,
): { status: ConventionStatus } => isValid;

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
  expiredJwt: AppSupportedJwt;
};

export type RenewMagicLinkResponse = {
  message: typeof expiredMagicLinkErrorMessage;
  needsNewMagicLink: boolean;
};

export type RenewConventionParams = Pick<
  ConventionRenewed,
  "id" | "dateStart" | "dateEnd" | "schedule" | "renewed"
>;

export type MarkPartnersErroredConventionAsHandledRequest = {
  conventionId: ConventionId;
};

export type FindSimilarConventionsParams = {
  siret: SiretDto;
  codeAppellation: AppellationCode;
  dateStart: DateString;
  beneficiaryBirthdate: DateString;
  beneficiaryLastName: string;
};

export type FindSimilarConventionsResponseDto = {
  similarConventionIds: ConventionId[];
};

export const labelsForImmersionObjective: Record<ImmersionObjective, string> = {
  "Confirmer un projet professionnel": "Je compte me former à ce métier",
  "Découvrir un métier ou un secteur d'activité":
    "J'en suis au premier stade de mon orientation et je veux en savoir plus sur ce métier",
  "Initier une démarche de recrutement": "Je suis à la recherche d'un emploi",
};

export const isStringImmersionObjective = (
  objective: string | unknown,
): objective is ImmersionObjective =>
  keys(labelsForImmersionObjective).includes(objective as ImmersionObjective);

export const reminderKinds = [
  "ReminderForSignatories",
  "FirstReminderForAgency",
  "LastReminderForAgency",
] as const;

export type ReminderKind = (typeof reminderKinds)[number];

export const userHasEnoughRightsOnConvention = (
  user: UserWithAdminRights & UserWithAgencyRights,
  convention: ConventionDto,
  allowedRoles: AgencyRole[],
): boolean =>
  user.agencyRights.some(
    (agencyRight) =>
      agencyRight.agency.id === convention.agencyId &&
      agencyRight.roles.some((role) => allowedRoles.includes(role)),
  ) || !!user.isBackofficeAdmin;

export const getExactAge = ({
  birthDate,
  referenceDate,
}: { birthDate: Date; referenceDate: Date }): number => {
  return differenceInYears(startOfDay(referenceDate), startOfDay(birthDate));
};

export type GetPaginatedConventionsFilters = {
  actorEmailContains?: string;
  establishmentNameContains?: string;
  beneficiaryNameContains?: string;
  statuses?: NotEmptyArray<ConventionStatus>;
  agencyIds?: NotEmptyArray<string>;
  agencyDepartmentCodes?: NotEmptyArray<string>;
  dateStart?: DateFilter;
  dateEnd?: DateFilter;
  dateSubmission?: DateFilter;
};

export type GetPaginatedConventionsSortBy = keyof Pick<
  ConventionDto,
  "dateValidation" | "dateStart" | "dateSubmission"
>;

export type GetConventionsForAgencyUserParams = {
  filters?: GetPaginatedConventionsFilters;
  sortBy?: GetPaginatedConventionsSortBy;
  pagination?: PaginationQueryParams;
};

export type FlatGetConventionsForAgencyUserParams = {
  // pagination
  page?: number;
  perPage?: number;

  // sort
  sortBy?: GetPaginatedConventionsSortBy;

  // filters
  actorEmailContains?: string;
  establishmentNameContains?: string;
  beneficiaryNameContains?: string;
  statuses?: NotEmptyArray<ConventionStatus>;
  agencyIds?: NotEmptyArray<string>;
  agencyDepartmentCodes?: NotEmptyArray<string>;

  // date filters
  dateStartFrom?: DateString;
  dateStartTo?: DateString;
  dateEndFrom?: DateString;
  dateEndTo?: DateString;
  dateSubmissionFrom?: DateString;
  dateSubmissionTo?: DateString;
};
