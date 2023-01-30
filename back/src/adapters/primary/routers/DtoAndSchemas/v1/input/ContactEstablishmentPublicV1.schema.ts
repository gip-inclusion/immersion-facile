import { contactEstablishmentRequestSchema } from "shared";
import { z } from "zod";
import { ContactEstablishmentPublicV1Dto } from "./ContactEstablishmentPublicV1.dto";

export const contactEstablishmentPublicV1Schema: z.Schema<ContactEstablishmentPublicV1Dto> =
  contactEstablishmentRequestSchema;
