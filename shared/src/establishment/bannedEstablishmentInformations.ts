import z from "zod";
import type { WithSiretDto } from "../siret/siret";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1Max1024 } from "../utils/string.schema";

type WithEstablishmentBannishmentJustification = {
  establishmentBannishmentJustification: string;
};

export const withEstablishmentBannishmentJustificationSchema = z.object({
  establishmentBannishmentJustification: zStringMinLength1Max1024,
});

export type WithBannedEstablishmentInformations =
  | { isEstablishmentBanned: false }
  | ({
      isEstablishmentBanned: true;
    } & WithEstablishmentBannishmentJustification);

export const withBannedEstablishmentInformationSchema = z.discriminatedUnion(
  "isEstablishmentBanned",
  [
    z.object({ isEstablishmentBanned: z.literal(false) }),
    z
      .object({ isEstablishmentBanned: z.literal(true) })
      .extend(withEstablishmentBannishmentJustificationSchema.shape),
  ],
);

export type BanEstablishmentPayload = WithSiretDto &
  WithEstablishmentBannishmentJustification;

export const banEstablishmentPayloadSchema = z
  .object({
    siret: siretSchema,
  })
  .extend(withEstablishmentBannishmentJustificationSchema.shape);
