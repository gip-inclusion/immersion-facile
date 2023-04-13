import { z } from "zod";

import { contactEstablishmentRequestSchema } from "shared";

import { ContactEstablishmentPublicV1Dto } from "./ContactEstablishmentPublicV1.dto";

export const contactEstablishmentPublicV1Schema: z.Schema<ContactEstablishmentPublicV1Dto> =
  contactEstablishmentRequestSchema;
