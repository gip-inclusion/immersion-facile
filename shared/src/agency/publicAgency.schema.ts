import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { addressSchema } from "../address/address.schema";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  stringWithMaxLength255,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import { agencyIdSchema, agencyKindSchema } from "./agency.schema";
import type {
  AgencyPublicDisplayDto,
  AgencyPublicDisplayDtoWithoutRefersToAgency,
  WithOptionalRefersToAgency,
} from "./publicAgency.dto";

//TODO > wait for zod release with pick feature on object (developed but not released)
export const agencyPublicDisplayDtoWithoutRefersToAgencySchema: ZodSchemaWithInputMatchingOutput<AgencyPublicDisplayDtoWithoutRefersToAgency> =
  z.object({
    id: agencyIdSchema,
    name: stringWithMaxLength255,
    kind: agencyKindSchema,
    address: addressSchema,
    position: geoPositionSchema,
    signature: stringWithMaxLength255,
    agencySiret: siretSchema,
    logoUrl: absoluteUrlSchema.or(z.null()),
  });

export const withOptionalRefersToAgencySchema: ZodSchemaWithInputMatchingOutput<WithOptionalRefersToAgency> =
  z.object({
    refersToAgency: agencyPublicDisplayDtoWithoutRefersToAgencySchema.or(
      z.null(),
    ),
  });

export const agencyPublicDisplaySchema: ZodSchemaWithInputMatchingOutput<AgencyPublicDisplayDto> =
  agencyPublicDisplayDtoWithoutRefersToAgencySchema.and(
    withOptionalRefersToAgencySchema,
  );
