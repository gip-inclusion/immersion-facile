import { AgencyId } from "../agency/agency.dto";
import { LegacyScheduleDto, ScheduleDto } from "../ScheduleSchema";
import { SiretDto } from "../siret";
import { Flavor } from "../typeFlavors";

import { Role } from "../tokens/MagicLinkPayload";
import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export type ApplicationStatus = typeof validApplicationStatus[number];

export const validApplicationStatus = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "IN_REVIEW",
  "ACCEPTED_BY_COUNSELLOR",
  "ACCEPTED_BY_VALIDATOR",
  "VALIDATED",
  "REJECTED",
] as const;

export type ImmersionApplicationId = Flavor<string, "ImmersionApplicationId">;

export type ImmersionApplicationDto = {
  id: ImmersionApplicationId;
  status: ApplicationStatus;
  rejectionJustification?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  postalCode?: string;
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
  peExternalId?: string;
};

export type WithImmersionApplicationId = {
  id: ImmersionApplicationId;
};

export type UpdateImmersionApplicationRequestDto = {
  immersionApplication: ImmersionApplicationDto;
  id: string;
};

export type ListImmersionApplicationRequestDto = {
  agencyId?: string;
  status?: ApplicationStatus;
};

export type UpdateImmersionApplicationStatusRequestDto = {
  status: ApplicationStatus;
  justification?: string;
};

export type GenerateMagicLinkRequestDto = {
  applicationId: ImmersionApplicationId;
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
