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
  Attachment,
  DiscussionAccepted,
  DiscussionId,
  DiscussionPending,
  DiscussionReadDto,
  DiscussionRejected,
  DiscussionStatusWithRejection,
  Exchange,
  ExchangeRole,
  WithDiscussionRejection,
  exchangeRoles,
} from "./discussion.dto";

export const discussionIdSchema: z.Schema<DiscussionId> = z.string().uuid();

const exchangeRoleSchema: z.Schema<ExchangeRole> = z.enum(exchangeRoles);

const attachementSchema: z.Schema<Attachment> = z.object({
  name: z.string(),
  link: z.string(),
});

const exchangeSchema: z.Schema<Exchange> = z.object({
  subject: zStringMinLength1,
  message: zStringMinLength1,
  sender: exchangeRoleSchema,
  recipient: exchangeRoleSchema,
  sentAt: dateStringSchema,
  attachments: z.array(attachementSchema),
});

export const discussionRejectionSchema: z.Schema<WithDiscussionRejection> =
  z.union([
    z.object({
      rejectionKind: z.literal("OTHER"),
      rejectionReason: zStringMinLength1,
    }),
    z.object({
      rejectionKind: z.enum(["UNABLE_TO_HELP", "NO_TIME"]),
    }),
  ]);

export const discussionRejectedSchema: z.Schema<DiscussionRejected> = z
  .object({
    status: z.literal("REJECTED"),
  })
  .and(discussionRejectionSchema);

const discussionNotRejectedSchema: z.Schema<
  DiscussionAccepted | DiscussionPending
> = z.object({
  status: z.enum(["PENDING", "ACCEPTED"]),
});

const discussionStatusSchema: z.Schema<DiscussionStatusWithRejection> = z.union(
  [discussionRejectedSchema, discussionNotRejectedSchema],
);

export const discussionReadSchema: z.Schema<DiscussionReadDto> = z
  .object({
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
      hasWorkingExperience: z.boolean().optional(),
      experienceAdditionalInformation: zStringMinLength1.optional(),
      datePreferences: zStringMinLength1.optional(),
    }),
    establishmentContact: z.object({
      firstName: zStringMinLength1,
      lastName: zStringMinLength1,
      job: zStringMinLength1,
      contactMethod: contactMethodSchema,
    }),
    exchanges: z.array(exchangeSchema),
    conventionId: conventionIdSchema.optional(),
  })
  .and(discussionStatusSchema);
