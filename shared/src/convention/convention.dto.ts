import { AgencyId } from "../agency/agency.dto";
import { FederatedIdentity } from "../federatedIdentities/federatedIdentity.dto";
import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { ScheduleDto } from "../schedule/Schedule.dto";
import { SiretDto } from "../siret";

import { Role } from "../tokens/MagicLinkPayload";
import { Flavor } from "../typeFlavors";

export type ConventionStatus = typeof allConventionStatuses[number];
export const allConventionStatuses = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "IN_REVIEW",
  "ACCEPTED_BY_COUNSELLOR",
  "ACCEPTED_BY_VALIDATOR",
  "REJECTED",
  "CANCELLED",
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
  mentor: Mentor;
};

export type Signatories = {
  beneficiary: Beneficiary;
  establishmentRepresentative: EstablishmentRepresentative;
  beneficiaryRepresentative?: BeneficiaryRepresentative;
};

export type SignatoryRole =
  Required<Signatories>[keyof Required<Signatories>]["role"];
export type Signatory = GenericSignatory<SignatoryRole>;

export const signatoryRoles: SignatoryRole[] = [
  "beneficiary",
  "beneficiary-representative",
  "legal-representative2", // legacy, now named : beneficiary-representative
  "establishment2", // legacy, now named : establishment-representative
  "establishment-representative",
];

type GenericSignatory<R extends Role> = {
  role: R;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  signedAt?: string; // Date iso string
};

export type Beneficiary = GenericSignatory<"beneficiary"> & {
  emergencyContact?: string;
  emergencyContactPhone?: string;
  federatedIdentity?: FederatedIdentity;
};

export type EstablishmentRepresentative = GenericSignatory<
  "establishment2" | "establishment-representative"
>;

export type Mentor = GenericSignatory<
  "establishment2" | "establishment-mentor"
> & {
  job: string;
};

export type BeneficiaryRepresentative = GenericSignatory<
  "beneficiary-representative" | "legal-representative2"
>;

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

export type UpdateConventionStatusRequestDto = {
  status: ConventionStatus;
  justification?: string;
};

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
