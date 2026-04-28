import z from "zod";
import type { WithSiretDto } from "../siret/siret";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1Max1024 } from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";

type WithEstablishmentBannishmentJustification = {
  establishmentBannishmentJustification: string;
};

const withEstablishmentBannishmentJustificationShape = {
  establishmentBannishmentJustification: zStringMinLength1Max1024,
};

export const withEstablishmentBannishmentJustificationSchema = z.object(
  withEstablishmentBannishmentJustificationShape,
);

export type WithBannedEstablishmentInformations =
  | { isEstablishmentBanned: false }
  | ({
      isEstablishmentBanned: true;
    } & WithEstablishmentBannishmentJustification);

export const withBannedEstablishmentInformationSchema: ZodSchemaWithInputMatchingOutput<WithBannedEstablishmentInformations> =
  z.union([
    z.object({ isEstablishmentBanned: z.literal(false) }),
    z.object({
      isEstablishmentBanned: z.literal(true),
      ...withEstablishmentBannishmentJustificationShape,
    }),
  ]);

export type BanEstablishmentPayload = WithSiretDto &
  WithEstablishmentBannishmentJustification;

export const banEstablishmentPayloadSchema = z.object({
  siret: siretSchema,
  ...withEstablishmentBannishmentJustificationShape,
});
