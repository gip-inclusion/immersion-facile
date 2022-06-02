import { AgencyId } from "../agency/agency.dto";
import { LegacyScheduleDto, ScheduleDto } from "../schedule/ScheduleSchema";
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
  "VALIDATED",
  "REJECTED",
  "CANCELLED",
] as const;

export const validatedConventionStatuses: ConventionStatus[] = [
  "ACCEPTED_BY_VALIDATOR",
  "VALIDATED",
];

export type ConventionId = Flavor<string, "ConventionId">;
export type ConventionExternalId = Flavor<string, "ConventionExternalId">;

export type ConventionDtoWithoutExternalId = {
  id: ConventionId;
  status: ConventionStatus;
  rejectionJustification?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  agencyId: AgencyId;
  dateSubmission: string; // Date iso string
  dateStart: string; // Date iso string
  dateEnd: string; // Date iso string
  siret: SiretDto;
  businessName: string;
  mentor: string;
  mentorPhone: string;
  mentorEmail: string;
  schedule: ScheduleDto;
  legacySchedule?: LegacyScheduleDto;
  workConditions?: string;
  individualProtection: boolean;
  sanitaryPrevention: boolean;
  sanitaryPreventionDescription?: string;
  immersionAddress?: string;
  immersionObjective?: string;
  immersionAppellation: AppellationDto;
  immersionActivities: string;
  immersionSkills?: string;
  beneficiaryAccepted: boolean;
  enterpriseAccepted: boolean;
  federatedIdentity?: FederatedIdentity;
};

export type ConventionDto = ConventionDtoWithoutExternalId & {
  externalId: ConventionExternalId;
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
