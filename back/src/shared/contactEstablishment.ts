import { z } from "zod";
import { preferredContactMethodSchema } from "./FormEstablishmentDto";
import { immersionOfferIdSchema } from "./SearchImmersionDto";
import { zEmail, zString, zTrimmedString } from "./zodUtils";

export type ContactEstablishmentRequestDto = z.infer<
  typeof contactEstablishmentRequestSchema
>;
export const contactEstablishmentRequestSchema = z.object({
  immersionOfferId: immersionOfferIdSchema,
  contactMode: preferredContactMethodSchema,
  senderName: zTrimmedString.optional(),
  senderEmail: zEmail,
  message: zString,
});
