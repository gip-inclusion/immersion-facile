import { AgencyId } from "../agency/agency.dto";
import { ScheduleDto } from "../schedule/Schedule.dto";
import { SiretDto } from "../siret";
import { Flavor } from "../typeFlavors";

import { Role } from "../tokens/MagicLinkPayload";
import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { FederatedIdentity } from "../federatedIdentities/federatedIdentity.dto";

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
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  agencyId: AgencyId;
  dateSubmission: string; // Date iso string
  dateStart: string; // Date iso string
  dateEnd: string; // Date iso string
  dateValidation?: string; // Date iso string (undefined until the convention is validated)
  siret: SiretDto;
  businessName: string;
  mentor: string;
  mentorPhone: string;
  mentorEmail: string;
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
  beneficiaryAccepted: boolean;
  enterpriseAccepted: boolean;
  federatedIdentity?: FederatedIdentity;
  internshipKind: InternshipKind;
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
