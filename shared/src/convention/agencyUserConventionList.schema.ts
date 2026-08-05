import { z } from "zod";
import { businessNameSchema } from "../establishment/businessComponents.schema";
import { ftConnectIdentityWithoutTokenSchema } from "../federatedIdentities/federatedIdentity.schema";
import type { DataWithPagination } from "../pagination/pagination.dto";
import { createPaginatedSchema } from "../pagination/pagination.schema";
import {
  firstnameMandatorySchema,
  lastnameMandatorySchema,
} from "../user/user.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type { AgencyUserConventionListDto } from "./agencyUserConventionList.dto";
import {
  conventionAssessmentFieldsSchema,
  conventionDateEndSchema,
  conventionDateStartSchema,
  conventionIdSchema,
  conventionStatusSchema,
  withOptionalFirstnameAndLastnameSchema,
} from "./convention.schema";

export const agencyUserConventionListDtoSchema: ZodSchemaWithInputMatchingOutput<AgencyUserConventionListDto> =
  z.object({
    id: conventionIdSchema,
    status: conventionStatusSchema,
    dateStart: conventionDateStartSchema,
    dateEnd: conventionDateEndSchema,
    businessName: businessNameSchema,
    agencyName: z.string(),
    agencyReferent: withOptionalFirstnameAndLastnameSchema.optional(),
    assessment: conventionAssessmentFieldsSchema,
    beneficiary: z.object({
      firstName: firstnameMandatorySchema,
      lastName: lastnameMandatorySchema,
      federatedIdentity: ftConnectIdentityWithoutTokenSchema.optional(),
    }),
  });

export const paginatedAgencyUserConventionListSchema: ZodSchemaWithInputMatchingOutput<
  DataWithPagination<AgencyUserConventionListDto>
> = createPaginatedSchema(agencyUserConventionListDtoSchema);
