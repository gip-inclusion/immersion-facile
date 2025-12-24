import z from "zod";
import {
  agencyIdSchema,
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
import { OmitFromExistingKeys } from "../utils";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  localization,
  zBoolean,
  zStringPossiblyEmptyWithMax,
  zTrimmedStringWithMax,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import { ConventionReadDto } from "./convention.dto";
import {
  conventionIdSchema,
  conventionValidatorsSchema,
  conventionWithInternshipKindSchema,
  establishmentTutorSchema,
  immersionObjectiveSchema,
  withOptionalFirstnameAndLastnameSchema,
} from "./convention.schema";
import type { ConventionPresentation } from "./conventionPresentation.dto";

export type ConventionToShareDto = Partial<OmitFromExistingKeys<ConventionPresentation, "status" | "statusJustification" | "updatedAt" | "dateValidation" | "dateApproval" | "renewed"| "agencyDepartment" | "agencyRefersTo">>;

export const conventionToShareSchema: ZodSchemaWithInputMatchingOutput<ConventionToShareDto> =
  z.object({
    id: conventionIdSchema,
    statusJustification: z.string().optional(),
    agencyId: agencyIdSchema,
    dateSubmission: makeDateStringSchema(),
    dateStart: makeDateStringSchema(localization.invalidDateStart),
    dateEnd: makeDateStringSchema(localization.invalidDateEnd),
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
    establishmentNumberEmployeesRange: numberOfEmployeesRangeSchema.optional(),
    acquisitionCampaign: z.string().optional(),
    acquisitionKeyword: z.string().optional(),
  });

const testSchema = z.object({ test: z.string()});
// export const makeSchemaPartial: ZodSchemaWithInputMatchingOutput<Partial<ConventionReadDto>> = conventionWithInternshipKindSchema.partial();

export type ShareConventionLinkByEmailDto = {
  senderEmail: string;
  recipientEmail?: string;
  details?: string;
  convention: ConventionToShareDto;
};
