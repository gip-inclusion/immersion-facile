import z from "zod";
import type { WithSiretDto } from "../siret/siret";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1Max1024 } from "../utils/string.schema";

type WithBannishmentJustification = {
  bannishmentJustification: string;
};
const withBannishmentJustificationSchema = z.object({
  bannishmentJustification: zStringMinLength1Max1024,
});

export type WithBannedEstablishmentInformations =
  | { isBanned: false }
  | ({
      isBanned: true;
    } & WithBannishmentJustification);

export const withBannedEstablishmentInformationSchema = z.discriminatedUnion(
  "isBanned",
  [
    z.object({ isBanned: z.literal(false) }),
    z
      .object({ isBanned: z.literal(true) })
      .extend(withBannishmentJustificationSchema.shape),
  ],
);

export type BanEstablishmentPayload = WithSiretDto &
  WithBannishmentJustification;

export const banEstablishmentPayloadSchema = z
  .object({
    siret: siretSchema,
  })
  .extend(withBannishmentJustificationSchema.shape);
