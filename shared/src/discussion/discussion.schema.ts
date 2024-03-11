import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { addressSchema } from "../address/address.schema";
import {
  immersionObjectiveSchema,
  phoneSchema,
} from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { contactMethodSchema } from "../formEstablishment/FormEstablishment.schema";
import { appellationCodeSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { dateStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1 } from "../zodUtils";
import {
  DiscussionDto,
  DiscussionEstablishmentContact,
  DiscussionId,
  DiscussionPotentialBeneficiary,
  Exchange,
  ExchangeRole,
  exchangeRoles,
} from "./discussion.dto";

export const discussionIdSchema: z.Schema<DiscussionId> = z.string();

const discussionEstablishmentContactSchema: z.Schema<DiscussionEstablishmentContact> =
  z.object({
    email: emailSchema,
    copyEmails: z.array(emailSchema),
    firstName: zStringMinLength1,
    lastName: zStringMinLength1,
    phone: phoneSchema,
    job: zStringMinLength1,
    contactMethod: contactMethodSchema,
  });

const discussionPotentialBeneficiarySchema: z.Schema<DiscussionPotentialBeneficiary> =
  z.object({
    email: emailSchema,
    firstName: zStringMinLength1,
    lastName: zStringMinLength1,
    phone: phoneSchema.optional(),
    resumeLink: absoluteUrlSchema.optional(),
  });

const exchangeRoleSchema: z.Schema<ExchangeRole> = z.enum(exchangeRoles);

const exchangeSchema: z.Schema<Exchange> = z.object({
  subject: zStringMinLength1,
  message: zStringMinLength1,
  sender: exchangeRoleSchema,
  recipient: exchangeRoleSchema,
  sentAt: dateStringSchema,
});
export const discussionSchema: z.Schema<DiscussionDto> = z.object({
  id: discussionIdSchema,
  createdAt: dateStringSchema,
  siret: siretSchema,
  businessName: zStringMinLength1,
  appellationCode: appellationCodeSchema,
  immersionObjective: immersionObjectiveSchema,
  address: addressSchema,
  potentialBeneficiary: discussionPotentialBeneficiarySchema,
  establishmentContact: discussionEstablishmentContactSchema,
  exchanges: z.array(exchangeSchema),
});
