import z from "zod";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1Max1024 } from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type { WithBannedEstablishmentInformations } from "./bannedEstablishmentInformations.dto";

const withEstablishmentBannishmentJustificationShape = {
  establishmentBannishmentJustification: zStringMinLength1Max1024,
};

export const withEstablishmentBannishmentJustificationSchema = z.object(
  withEstablishmentBannishmentJustificationShape,
);

export const withBannedEstablishmentInformationSchema: ZodSchemaWithInputMatchingOutput<WithBannedEstablishmentInformations> =
  z.union([
    z.object({ isEstablishmentBanned: z.literal(false) }),
    z.object({
      isEstablishmentBanned: z.literal(true),
      ...withEstablishmentBannishmentJustificationShape,
    }),
  ]);

export const banEstablishmentPayloadSchema = z.object({
  siret: siretSchema,
  ...withEstablishmentBannishmentJustificationShape,
});
