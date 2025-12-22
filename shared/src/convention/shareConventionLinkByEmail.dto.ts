import z from "zod";
import {
  agencyIdSchema,
  agencyKindSchema,
  refersToAgencyIdSchema,
} from "../agency/agency.schema";
import { businessNameSchema } from "../business/business";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import {
  makeDateStringSchema,
  scheduleSchema,
} from "../schedule/Schedule.schema";
import {
  numberOfEmployeesRangeSchema,
  siretSchema,
} from "../siret/siret.schema";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zBoolean,
  zStringMinLength1,
  zStringPossiblyEmptyWithMax,
  zTrimmedStringWithMax,
} from "../zodUtils";
import { conventionStatuses } from "./convention.dto";
import {
  conventionIdSchema,
  conventionValidatorsSchema,
  establishmentTutorSchema,
  immersionObjectiveSchema,
  renewedSchema,
  withOptionalFirstnameAndLastnameSchema,
} from "./convention.schema";
import type { ConventionPresentation } from "./conventionPresentation.dto";

export type ConventionToShareDto = Partial<ConventionPresentation>;

export const conventionToShareSchema: ZodSchemaWithInputMatchingOutput<ConventionToShareDto> =
  z.object({
    id: conventionIdSchema,
    status: z.enum(conventionStatuses, {
      error: localization.invalidEnum,
    }),
    statusJustification: z.string().optional(),
    agencyId: agencyIdSchema,
    updatedAt: makeDateStringSchema().optional(),
    dateSubmission: makeDateStringSchema(),
    dateStart: makeDateStringSchema(localization.invalidDateStart),
    dateEnd: makeDateStringSchema(localization.invalidDateEnd),
    dateValidation: makeDateStringSchema(
      localization.invalidValidationFormatDate,
    ).optional(),
    dateApproval: makeDateStringSchema(
      localization.invalidApprovalFormatDate,
    ).optional(),
    siret: siretSchema,
    businessName: businessNameSchema,
    schedule: scheduleSchema,
    workConditions: z.string().optional(),
    businessAdvantages: z.string().optional(),
    individualProtection: zBoolean,
    individualProtectionDescription: zStringPossiblyEmptyWithMax(255),
    sanitaryPrevention: zBoolean,
    sanitaryPreventionDescription: zStringPossiblyEmptyWithMax(255),
    immersionAddress: addressWithPostalCodeSchema,
    immersionObjective: immersionObjectiveSchema,
    immersionAppellation: appellationDtoSchema,
    immersionActivities: zTrimmedStringWithMax(2000),
    immersionSkills: zStringPossiblyEmptyWithMax(2000),
    establishmentTutor: establishmentTutorSchema,
    validators: conventionValidatorsSchema.optional(),
    agencyReferent: withOptionalFirstnameAndLastnameSchema.optional(),
    renewed: renewedSchema.optional(),
    establishmentNumberEmployeesRange: numberOfEmployeesRangeSchema.optional(),
    agencyDepartment: z.string(),
    agencyRefersTo: z
      .object({
        id: refersToAgencyIdSchema,
        name: zStringMinLength1,
        kind: agencyKindSchema,
      })
      .optional(),
    acquisitionCampaign: z.string().optional(),
    acquisitionKeyword: z.string().optional(),
  });

export type ShareConventionLinkByEmailDto = {
  senderEmail: string;
  recipientEmail?: string;
  details?: string;
  convention: ConventionToShareDto;
};
