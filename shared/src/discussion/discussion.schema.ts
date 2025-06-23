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
import { createPaginatedSchema } from "../pagination/pagination.schema";
import { phoneSchema } from "../phone.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { makeDateStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import { zStringCanBeEmpty, zStringMinLength1 } from "../zodUtils";
import {
  type Attachment,
  type CandidateWarnedMethod,
  type CommonDiscussionDto,
  type DiscussionEmailParams,
  type DiscussionId,
  type DiscussionInList,
  type DiscussionReadDto,
  type Exchange,
  type ExchangeFromDashboard,
  type ExchangeRole,
  type FlatGetPaginatedDiscussionsParams,
  type LegacyDiscussionEmailParams,
  type PotentialBeneficiaryCommonProps,
  type WithDiscussionRejection,
  type WithDiscussionStatus,
  type WithDiscussionStatusAccepted,
  type WithDiscussionStatusPending,
  type WithDiscussionStatusRejected,
  candidateWarnedMethods,
} from "./discussion.dto";

export const discussionIdSchema: z.Schema<DiscussionId> = z.string().uuid();

export const exchangeRoles = ["establishment", "potentialBeneficiary"] as const;

export const makeExchangeEmailRegex = (replyDomain: string) =>
  new RegExp(`[^_]+_[^_]+__([^_]+)_([^@]+)@${replyDomain}$`);

export const makeLegacyExchangeEmailRegex = (replyDomain: string) =>
  new RegExp(`^[^_]+_[^_]+@${replyDomain}$`);

export const makeExchangeEmailSchema = (
  replyDomain: string,
): z.ZodUnion<
  [
    z.ZodEffects<z.ZodString, DiscussionEmailParams, string>,
    z.ZodEffects<z.ZodString, LegacyDiscussionEmailParams, string>,
  ]
> =>
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
    })
    .or(
      z
        .string()
        .email()
        .regex(makeLegacyExchangeEmailRegex(replyDomain))
        .transform((email) => {
          const [id, rawRecipientKind] = email.split("@")[0].split("_");
          return {
            discussionId: id satisfies DiscussionId,
            rawRecipientKind,
          };
        }),
    );

export const exchangeRoleSchema: z.Schema<ExchangeRole> = z.enum(exchangeRoles);

export const attachmentSchema: z.Schema<Attachment> = z.object({
  name: z.string(),
  link: z.string(),
});

export const exchangeSchema: z.Schema<Exchange> = z.object({
  subject: zStringMinLength1,
  message: zStringMinLength1,
  sender: exchangeRoleSchema,
  recipient: exchangeRoleSchema,
  sentAt: makeDateStringSchema(),
  attachments: z.array(attachmentSchema),
});
export const exchangesSchema: z.Schema<Exchange[]> = z.array(exchangeSchema);

const candidateWarnedMethodSchema = z.enum(
  candidateWarnedMethods,
) satisfies z.Schema<CandidateWarnedMethod>;

export const discussionRejectionSchema: z.Schema<WithDiscussionRejection> =
  z.union([
    z.object({
      rejectionKind: z.literal("OTHER"),
      rejectionReason: zStringMinLength1,
    }),
    z.object({
      rejectionKind: z.enum(["UNABLE_TO_HELP", "NO_TIME"]),
    }),
    z.object({
      rejectionKind: z.literal("CANDIDATE_ALREADY_WARNED"),
      candidateWarnedMethod: candidateWarnedMethodSchema,
    }),
  ]);

const discussionAcceptedStatusSchema = z.literal("ACCEPTED");
const discussionRejectedStatusSchema = z.literal("REJECTED");
const discussionPendingStatusSchema = z.literal("PENDING");
const discussionStatusSchema = z.union([
  discussionAcceptedStatusSchema,
  discussionRejectedStatusSchema,
  discussionPendingStatusSchema,
]);

export const discussionAcceptedSchema: z.Schema<WithDiscussionStatusAccepted> =
  z.object({
    status: discussionAcceptedStatusSchema,
    candidateWarnedMethod: candidateWarnedMethodSchema.or(z.null()),
    conventionId: conventionIdSchema.optional(),
  });

export const discussionRejectedSchema: z.Schema<WithDiscussionStatusRejected> =
  z
    .object({
      status: discussionRejectedStatusSchema,
    })
    .and(discussionRejectionSchema);

export const withExchangeMessageSchema: z.Schema<
  Pick<ExchangeFromDashboard, "message">
> = z.object({
  message: zStringMinLength1,
});

export const exchangeMessageFromDashboardSchema: z.Schema<ExchangeFromDashboard> =
  withExchangeMessageSchema.and(z.object({ discussionId: discussionIdSchema }));

const discussionPendingSchema: z.Schema<WithDiscussionStatusPending> = z.object(
  {
    status: discussionPendingStatusSchema,
  },
);

export const withDiscussionStatusSchema: z.Schema<WithDiscussionStatus> =
  z.union([
    discussionRejectedSchema,
    discussionPendingSchema,
    discussionAcceptedSchema,
  ]);

const potentialBeneficiaryCommonSchema = z.object({
  firstName: zStringMinLength1,
  lastName: zStringMinLength1,
  email: zStringCanBeEmpty,
}) satisfies z.Schema<PotentialBeneficiaryCommonProps>;

const commonDiscussionSchema: z.Schema<CommonDiscussionDto> = z
  .object({
    id: discussionIdSchema,
    createdAt: makeDateStringSchema(),
    siret: siretSchema,
    businessName: zStringMinLength1,
    address: addressSchema,
    exchanges: exchangesSchema,
    conventionId: conventionIdSchema.optional(),
  })
  .and(withDiscussionStatusSchema);

const discussionKindIfSchema = z.literal("IF");
const discussionKind1Eleve1StageSchema = z.literal("1_ELEVE_1_STAGE");

const discussionLevelOfEducationSchema = z.enum(["3ème", "2nde"]);

export const discussionReadSchema: z.Schema<DiscussionReadDto> =
  commonDiscussionSchema
    .and(
      z.object({
        appellation: appellationDtoSchema,
        establishmentContact: z.object({
          firstName: zStringMinLength1,
          lastName: zStringMinLength1,
          job: zStringMinLength1,
        }),
      }),
    )
    .and(
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

export const flatGetPaginatedDiscussionsParamsSchema: z.Schema<FlatGetPaginatedDiscussionsParams> =
  z.object({
    // pagination
    page: z.coerce.number().optional(),
    perPage: z.coerce.number().optional(),

    // sort
    orderBy: z.enum(["createdAt"]).optional(),
    orderDirection: z.enum(["asc", "desc"]).optional(),

    // filters
    statuses: discussionStatusSchema
      .optional()
      .or(z.array(discussionStatusSchema).optional())
      .optional(),
    search: z.string().optional(),
  });

export const discussionInListSchema: z.Schema<DiscussionInList> = z.object({
  id: discussionIdSchema,
  siret: siretSchema,
  status: discussionStatusSchema,
  appellation: appellationDtoSchema,
  businessName: zStringMinLength1,
  createdAt: makeDateStringSchema(),
  kind: z.union([discussionKindIfSchema, discussionKind1Eleve1StageSchema]),
  exchanges: exchangesSchema,
  city: zStringMinLength1,
  potentialBeneficiary: z.object({
    firstName: zStringMinLength1,
    lastName: zStringMinLength1,
    phone: phoneSchema.nullable(),
  }),
  immersionObjective: immersionObjectiveSchema.nullable(),
});

export const paginatedDiscussionListSchema = createPaginatedSchema(
  discussionInListSchema,
);
