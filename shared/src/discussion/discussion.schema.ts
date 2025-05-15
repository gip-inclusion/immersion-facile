import { z } from "zod";
import { addressSchema } from "../address/address.schema";
import {
  preferEmailContactSchema,
  preferInPersonContactSchema,
  preferPhoneContactSchema,
} from "../contactEstablishmentRequest/contactEstablishmentRequest.schema";
import { discoverObjective } from "../convention/convention.dto";
import {
  conventionIdSchema,
  immersionObjectiveSchema,
} from "../convention/convention.schema";
import { phoneSchema } from "../phone.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { makeDateStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import type { OmitFromExistingKeys } from "../utils";
import { zStringCanBeEmpty, zStringMinLength1 } from "../zodUtils";
import type {
  Attachment,
  DiscussionAccepted,
  DiscussionId,
  DiscussionPending,
  DiscussionReadDto,
  DiscussionRejected,
  DiscussionStatusWithRejection,
  Exchange,
  ExchangeRole,
  PotentialBeneficiaryCommonProps,
  WithDiscussionRejection,
} from "./discussion.dto";

export const discussionIdSchema: z.Schema<DiscussionId> = z.string().uuid();

export const exchangeRoles = ["establishment", "potentialBeneficiary"] as const;

export const makeExchangeEmailRegex = (replyDomain: string) =>
  new RegExp(`[^_]+_[^_]+__([^_]+)_([^@]+)@${replyDomain}$`);

export const makeExchangeEmailSchema = (replyDomain: string) =>
  z
    .string()
    .email()
    .regex(makeExchangeEmailRegex(replyDomain))
    .transform((email) => {
      const [namepart, discussionPart] = email.split("@")[0].split("__");
      const [firstname, lastname] = namepart.split("_");
      const [id, rawRecipientKind] = discussionPart.split("_");
      return {
        firstname,
        lastname,
        discussionId: id satisfies DiscussionId,
        rawRecipientKind,
      };
    });

const exchangeRoleSchema: z.Schema<ExchangeRole> = z.enum(exchangeRoles);

const attachementSchema: z.Schema<Attachment> = z.object({
  name: z.string(),
  link: z.string(),
});

export const exchangeSchema: z.Schema<Exchange> = z.object({
  subject: zStringMinLength1,
  message: zStringMinLength1,
  sender: exchangeRoleSchema,
  recipient: exchangeRoleSchema,
  sentAt: makeDateStringSchema(),
  attachments: z.array(attachementSchema),
});
export const exchangesSchema: z.Schema<Exchange[]> = z.array(exchangeSchema);

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

const potentialBeneficiaryCommonSchema = z.object({
  firstName: zStringMinLength1,
  lastName: zStringMinLength1,
  email: zStringCanBeEmpty,
}) satisfies z.Schema<PotentialBeneficiaryCommonProps>;

export const commonDiscussionReadSchema: z.Schema<
  OmitFromExistingKeys<
    DiscussionReadDto,
    "kind" | "contactMode" | "potentialBeneficiary"
  >
> = z
  .object({
    id: discussionIdSchema,
    createdAt: makeDateStringSchema(),
    siret: siretSchema,
    businessName: zStringMinLength1,
    appellation: appellationDtoSchema,
    address: addressSchema,
    establishmentContact: z.object({
      firstName: zStringMinLength1,
      lastName: zStringMinLength1,
      job: zStringMinLength1,
    }),
    exchanges: exchangesSchema,
    conventionId: conventionIdSchema.optional(),
  })
  .and(discussionStatusSchema);

const discussionKindIfSchema = z.literal("IF");
const discussionKind1Eleve1StageSchema = z.literal("1_ELEVE_1_STAGE");

const discussionLevelOfEducationSchema = z.enum(["3ème", "2nde"]);

export const discussionReadSchema: z.Schema<DiscussionReadDto> =
  commonDiscussionReadSchema.and(
    z.union([
      z.object({
        contactMode: preferEmailContactSchema,
        kind: discussionKindIfSchema,
        potentialBeneficiary: potentialBeneficiaryCommonSchema.extend({
          phone: phoneSchema,
          datePreferences: zStringMinLength1,
          immersionObjective: immersionObjectiveSchema.or(z.null()),
          resumeLink: zStringCanBeEmpty.optional(),
          hasWorkingExperience: z.boolean().optional(),
          experienceAdditionalInformation: zStringMinLength1.optional(),
        }),
      }),
      z.object({
        contactMode: preferEmailContactSchema,
        kind: discussionKind1Eleve1StageSchema,
        potentialBeneficiary: potentialBeneficiaryCommonSchema.extend({
          phone: phoneSchema,
          datePreferences: zStringMinLength1,
          immersionObjective: z.literal(discoverObjective),
          levelOfEducation: discussionLevelOfEducationSchema,
        }),
      }),
      z.object({
        contactMode: preferInPersonContactSchema,
        kind: discussionKindIfSchema,
        potentialBeneficiary: potentialBeneficiaryCommonSchema,
      }),
      z.object({
        contactMode: preferInPersonContactSchema,
        kind: discussionKind1Eleve1StageSchema,
        potentialBeneficiary: potentialBeneficiaryCommonSchema.extend({
          levelOfEducation: z.enum(["3ème", "2nde"]),
        }),
      }),
      z.object({
        contactMode: preferPhoneContactSchema,
        kind: discussionKindIfSchema,
        potentialBeneficiary: potentialBeneficiaryCommonSchema,
      }),
      z.object({
        contactMode: preferPhoneContactSchema,
        kind: discussionKind1Eleve1StageSchema,
        potentialBeneficiary: potentialBeneficiaryCommonSchema.extend({
          levelOfEducation: z.enum(["3ème", "2nde"]),
        }),
      }),
    ]),
  );
