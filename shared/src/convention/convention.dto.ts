import { AgencyId } from "../agency/agency.dto";
import { FederatedIdentity } from "../federatedIdentities/federatedIdentity.dto";
import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { ScheduleDto } from "../schedule/Schedule.dto";
import { SiretDto } from "../siret/siret";
import { Role } from "../tokens/MagicLinkPayload";
import { Flavor } from "../typeFlavors";

export type ConventionStatus = typeof conventionStatuses[number];

type ConventionStatusWithoutJustification =
  typeof conventionStatusesWithoutJustification[number];

export const conventionStatusesWithoutJustification = [
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "IN_REVIEW",
  "ACCEPTED_BY_COUNSELLOR",
  "ACCEPTED_BY_VALIDATOR",
  "CANCELLED",
] as const;

export const doesStatusNeedsJustification = (
  status: ConventionStatus,
): status is ConventionStatusWithJustification =>
  conventionStatusesWithJustification.includes(
    status as ConventionStatusWithJustification,
  );

export type ConventionStatusWithJustification =
  typeof conventionStatusesWithJustification[number];
export const conventionStatusesWithJustification = [
  "REJECTED",
  "DRAFT",
] as const;
export const conventionStatuses = [
  ...conventionStatusesWithoutJustification,
  ...conventionStatusesWithJustification,
] as const;

export const maximumCalendarDayByInternshipKind: Record<
  InternshipKind,
  number
> = {
  immersion: 30,
  "mini-stage-cci": 5,
};

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
export type ImmersionObjective = typeof conventionObjectiveOptions[number];

export type WithJustification = { justification: string };

export type InternshipKind = "immersion" | "mini-stage-cci";

export type ConventionDtoWithoutExternalId = {
  id: ConventionId;
  status: ConventionStatus;
  rejectionJustification?: string;
  postalCode?: string;
  agencyId: AgencyId;
  dateSubmission: string; // Date iso string
  dateStart: string; // Date iso string
  dateEnd: string; // Date iso string
  dateValidation?: string; // Date iso string (undefined until the convention is validated)
  siret: SiretDto;
  businessName: string;
  schedule: ScheduleDto;
  workConditions?: string;
  individualProtection: boolean;
  sanitaryPrevention: boolean;
  sanitaryPreventionDescription: string;
  immersionAddress: string;
  immersionObjective: ImmersionObjective;
  immersionAppellation: AppellationDto;
  immersionActivities: string;
  immersionSkills: string;
  internshipKind: InternshipKind;
  signatories: Signatories;
  establishmentTutor: EstablishmentTutor;
};

export type Signatories = {
  beneficiary: Beneficiary;
  establishmentRepresentative: EstablishmentRepresentative;
  beneficiaryRepresentative?: BeneficiaryRepresentative;
  beneficiaryCurrentEmployer?: BeneficiaryCurrentEmployer;
};

export type SignatoryRole =
  Required<Signatories>[keyof Required<Signatories>]["role"];

export type Signatory = GenericSignatory<SignatoryRole>;

export const signatoryRoles: SignatoryRole[] = [
  "beneficiary",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "legal-representative", // legacy, now named : beneficiary-representative
  "establishment", // legacy, now named : establishment-representative
  "establishment-representative",
];

type GenericActor<R extends Role> = {
  role: R;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
};

type GenericSignatory<R extends Role> = GenericActor<R> & {
  signedAt?: string; // Date iso string
};

export type Beneficiary = GenericSignatory<"beneficiary"> & {
  emergencyContact?: string;
  emergencyContactPhone?: string;
  federatedIdentity?: FederatedIdentity;
  birthdate: string; // Date iso string
};

export type BeneficiaryRepresentative = GenericSignatory<
  "beneficiary-representative" | "legal-representative"
>;

export type BeneficiaryCurrentEmployer =
  GenericSignatory<"beneficiary-current-employer"> & {
    job: string;
    businessSiret: string;
    businessName: string;
  };

export type EstablishmentRepresentative = GenericSignatory<
  "establishment" | "establishment-representative"
>;

export type EstablishmentTutor = GenericActor<
  "establishment" | "establishment-tutor"
> & {
  job: string;
};

export type ConventionDto = ConventionDtoWithoutExternalId & {
  externalId: ConventionExternalId;
};

export type ConventionReadDto = ConventionDto & {
  agencyName: string;
};

export type WithConventionId = {
  id: ConventionId;
};

export type UpdateConventionRequestDto = {
  convention: ConventionDto;
  id: string;
};

export type ListConventionsRequestDto = {
  agencyId?: string;
  status?: ConventionStatus;
};

export type UpdateConventionStatusRequestDto =
  | { status: ConventionStatusWithoutJustification }
  | { status: ConventionStatusWithJustification; justification: string };

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
  linkFormat: string;
  expiredJwt: string;
};
