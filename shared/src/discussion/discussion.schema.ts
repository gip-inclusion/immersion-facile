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
import { phoneNumberSchema } from "../phone/phone.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { makeDateStringSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zStringCanBeEmpty,
  zStringMinLength1,
  zToNumber,
} from "../zodUtils";
import {
  type Attachment,
  type CandidateWarnedMethod,
  type CommonDiscussionDto,
  candidateWarnedMethods,
  type DiscussionExchangeForbiddenParams,
  type DiscussionExchangeForbiddenReason,
  type DiscussionId,
  type DiscussionInList,
  type DiscussionReadDto,
  type ExchangeFromDashboard,
  type ExchangeRead,
  type ExchangeRole,
  type FlatGetPaginatedDiscussionsParams,
  type PotentialBeneficiaryCommonProps,
  type WithDiscussionId,
  type WithDiscussionRejection,
  type WithDiscussionStatus,
  type WithDiscussionStatusAccepted,
  type WithDiscussionStatusPending,
  type WithDiscussionStatusRejected,
} from "./discussion.dto";

export const discussionIdSchema: ZodSchemaWithInputMatchingOutput<DiscussionId> =
  z.string().uuid();
export const withDiscussionIdSchema: ZodSchemaWithInputMatchingOutput<WithDiscussionId> =
  z.object({
    discussionId: discussionIdSchema,
  });

export const exchangeRoles = ["establishment", "potentialBeneficiary"] as const;
export const discussionExchangeForbidenReasons = [
  "establishment_missing",
  "discussion_completed",
] as const;

export const makeExchangeEmailRegex = (replyDomain: string) =>
  new RegExp(`[^_]+_[^_]+__([^_]+)_([^@]+)@${replyDomain}$`);

export const makeLegacyExchangeEmailRegex = (replyDomain: string) =>
  new RegExp(`^[^_]+_[^_]+@${replyDomain}$`);

export const makeExchangeEmailSchema = (replyDomain: string) =>
  z
    .email()
    .regex(makeExchangeEmailRegex(replyDomain), {
      error: localization.invalidEmailFormat,
    })
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
        .email()
        .regex(makeLegacyExchangeEmailRegex(replyDomain), {
          error: localization.invalidEmailFormat,
        })
        .transform((email) => {
          const [id, rawRecipientKind] = email.split("@")[0].split("_");
          return {
            discussionId: id satisfies DiscussionId,
            rawRecipientKind,
          };
        }),
    );

export const exchangeRoleSchema: ZodSchemaWithInputMatchingOutput<ExchangeRole> =
  z.enum(exchangeRoles, {
    error: localization.invalidEnum,
  });
export const discussionExchangeForbidenReasonSchema: ZodSchemaWithInputMatchingOutput<DiscussionExchangeForbiddenReason> =
  z.enum(discussionExchangeForbidenReasons, {
    error: localization.invalidEnum,
  });

export const attachmentSchema: ZodSchemaWithInputMatchingOutput<Attachment> =
  z.object({
    name: z.string(),
    link: z.string(),
  });

export const exchangeReadSchema: ZodSchemaWithInputMatchingOutput<ExchangeRead> =
  z
    .object({
      subject: zStringMinLength1,
      message: zStringMinLength1,
      sentAt: makeDateStringSchema(),
      attachments: z.array(attachmentSchema),
    })
    .and(
      z.discriminatedUnion("sender", [
        z.object({
          sender: z.literal("establishment"),
          firstname: z.string(),
          lastname: z.string(),
        }),
        z.object({
          sender: z.literal("potentialBeneficiary"),
        }),
      ]),
    );

const candidateWarnedMethodSchema = z.enum(candidateWarnedMethods, {
  error: localization.invalidEnum,
}) satisfies ZodSchemaWithInputMatchingOutput<CandidateWarnedMethod>;

export const discussionRejectionSchema: ZodSchemaWithInputMatchingOutput<WithDiscussionRejection> =
  z.union([
    z.object({
      rejectionKind: z.literal("OTHER"),
      rejectionReason: zStringMinLength1,
    }),
    z.object({
      rejectionKind: z.enum(["UNABLE_TO_HELP", "NO_TIME"], {
        error: localization.invalidEnum,
      }),
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

export const discussionAcceptedSchema: ZodSchemaWithInputMatchingOutput<WithDiscussionStatusAccepted> =
  z.object({
    status: discussionAcceptedStatusSchema,
    candidateWarnedMethod: candidateWarnedMethodSchema.or(z.null()),
    conventionId: conventionIdSchema.optional(),
  });

export const discussionRejectedSchema: ZodSchemaWithInputMatchingOutput<WithDiscussionStatusRejected> =
  z
    .object({
      status: discussionRejectedStatusSchema,
    })
    .and(discussionRejectionSchema);

export const withExchangeMessageSchema: ZodSchemaWithInputMatchingOutput<
  Pick<ExchangeFromDashboard, "message">
> = z.object({
  message: zStringMinLength1,
});

export const exchangeMessageFromDashboardSchema: ZodSchemaWithInputMatchingOutput<ExchangeFromDashboard> =
  withExchangeMessageSchema.and(z.object({ discussionId: discussionIdSchema }));

const discussionPendingSchema: ZodSchemaWithInputMatchingOutput<WithDiscussionStatusPending> =
  z.object({
    status: discussionPendingStatusSchema,
  });

export const withDiscussionStatusSchema: ZodSchemaWithInputMatchingOutput<WithDiscussionStatus> =
  z.union([
    discussionRejectedSchema,
    discussionPendingSchema,
    discussionAcceptedSchema,
  ]);

const potentialBeneficiaryCommonSchema = z.object({
  firstName: zStringMinLength1,
  lastName: zStringMinLength1,
  email: zStringCanBeEmpty,
}) satisfies ZodSchemaWithInputMatchingOutput<PotentialBeneficiaryCommonProps>;

const commonDiscussionSchema: ZodSchemaWithInputMatchingOutput<CommonDiscussionDto> =
  z
    .object({
      id: discussionIdSchema,
      createdAt: makeDateStringSchema(),
      siret: siretSchema,
      businessName: zStringMinLength1,
      address: addressSchema,
      conventionId: conventionIdSchema.optional(),
    })
    .and(withDiscussionStatusSchema);

const discussionKindIfSchema = z.literal("IF");
const discussionKind1Eleve1StageSchema = z.literal("1_ELEVE_1_STAGE");

const discussionLevelOfEducationSchema = z.enum(["3ème", "2nde"], {
  error: localization.invalidEnum,
});

export const discussionReadSchema: ZodSchemaWithInputMatchingOutput<DiscussionReadDto> =
  commonDiscussionSchema
    .and(
      z.object({
        appellation: appellationDtoSchema,
        exchanges: z.array(exchangeReadSchema),
      }),
    )
    .and(
      z.union([
        z.object({
          contactMode: preferEmailContactSchema,
          kind: discussionKindIfSchema,
          potentialBeneficiary: potentialBeneficiaryCommonSchema.extend({
            phone: phoneNumberSchema,
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
            phone: phoneNumberSchema,
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
            levelOfEducation: z.enum(["3ème", "2nde"], {
              error: localization.invalidEnum,
            }),
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
            levelOfEducation: z.enum(["3ème", "2nde"], {
              error: localization.invalidEnum,
            }),
          }),
        }),
      ]),
    );

export const flatGetPaginatedDiscussionsParamsSchema: ZodSchemaWithInputMatchingOutput<FlatGetPaginatedDiscussionsParams> =
  z.object({
    // pagination
    page: zToNumber.optional(),
    perPage: zToNumber.optional(),

    // sort
    orderBy: z
      .enum(["createdAt"], {
        error: localization.invalidEnum,
      })
      .optional(),
    orderDirection: z
      .enum(["asc", "desc"], {
        error: localization.invalidEnum,
      })
      .optional(),

    // filters
    statuses: discussionStatusSchema
      .optional()
      .or(z.array(discussionStatusSchema).optional())
      .optional(),
    search: z.string().optional(),
  });

export const discussionInListSchema: ZodSchemaWithInputMatchingOutput<DiscussionInList> =
  z.object({
    id: discussionIdSchema,
    siret: siretSchema,
    status: discussionStatusSchema,
    appellation: appellationDtoSchema,
    businessName: zStringMinLength1,
    createdAt: makeDateStringSchema(),
    kind: z.union([discussionKindIfSchema, discussionKind1Eleve1StageSchema]),
    exchanges: z.array(exchangeReadSchema),
    city: zStringMinLength1,
    potentialBeneficiary: z.object({
      firstName: zStringMinLength1,
      lastName: zStringMinLength1,
      phone: phoneNumberSchema.nullable(),
    }),
    immersionObjective: immersionObjectiveSchema.nullable(),
  });

export const paginatedDiscussionListSchema = createPaginatedSchema(
  discussionInListSchema,
);
export const discussionExchangeForbiddenParamsSchema: ZodSchemaWithInputMatchingOutput<DiscussionExchangeForbiddenParams> =
  z.object({
    sender: exchangeRoleSchema,
    reason: discussionExchangeForbidenReasonSchema,
  });
