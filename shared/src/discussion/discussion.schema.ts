import { z } from "zod";
import { addressSchema } from "../address/address.schema";
import {
  conventionIdSchema,
  immersionObjectiveSchema,
} from "../convention/convention.schema";
import { contactMethodSchema } from "../formEstablishment/FormEstablishment.schema";
import { phoneSchema } from "../phone.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { dateStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import { zStringMinLength1, zStringPossiblyEmpty } from "../zodUtils";
import {
  DiscussionId,
  DiscussionReadDto,
  Exchange,
  ExchangeRole,
  exchangeRoles,
} from "./discussion.dto";

export const discussionIdSchema: z.Schema<DiscussionId> = z.string().uuid();

const exchangeRoleSchema: z.Schema<ExchangeRole> = z.enum(exchangeRoles);

const exchangeSchema: z.Schema<Exchange> = z.object({
  subject: zStringMinLength1,
  message: zStringMinLength1,
  sender: exchangeRoleSchema,
  recipient: exchangeRoleSchema,
  sentAt: dateStringSchema,
});

export const discussionReadSchema: z.Schema<DiscussionReadDto> = z.object({
  id: discussionIdSchema,
  createdAt: dateStringSchema,
  siret: siretSchema,
  businessName: zStringMinLength1,
  appellation: appellationDtoSchema,
  immersionObjective: immersionObjectiveSchema,
  address: addressSchema,
  potentialBeneficiary: z.object({
    firstName: zStringMinLength1,
    lastName: zStringMinLength1,
    resumeLink: zStringPossiblyEmpty,
    phone: phoneSchema.optional(),
    email: zStringPossiblyEmpty,
  }),
  establishmentContact: z.object({
    firstName: zStringMinLength1,
    lastName: zStringMinLength1,
    job: zStringMinLength1,
    contactMethod: contactMethodSchema,
  }),
  exchanges: z.array(exchangeSchema),
  conventionId: conventionIdSchema.optional(),
});
