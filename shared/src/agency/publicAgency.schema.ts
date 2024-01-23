import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { addressSchema } from "../address/address.schema";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { siretSchema } from "../siret/siret.schema";
import { stringWithMaxLength255 } from "../zodUtils";
import { agencyIdSchema, agencyKindSchema } from "./agency.schema";
import {
  AgencyPublicDisplayDto,
  AgencyPublicDisplayDtoWithoutRefersToAgency,
  WithOptionalRefersToAgency,
} from "./publicAgency.dto";

//TODO > wait for zod release with pick feature on object (developed but not released)
export const agencyPublicDisplayDtoWithoutRefersToAgencySchema: z.Schema<AgencyPublicDisplayDtoWithoutRefersToAgency> =
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

export const withOptionalRefersToAgencySchema: z.Schema<WithOptionalRefersToAgency> =
  z.object({
    refersToAgency: agencyPublicDisplayDtoWithoutRefersToAgencySchema.or(
      z.null(),
    ),
  });

export const agencyPublicDisplaySchema: z.ZodSchema<AgencyPublicDisplayDto> =
  agencyPublicDisplayDtoWithoutRefersToAgencySchema.and(
    withOptionalRefersToAgencySchema,
  );
