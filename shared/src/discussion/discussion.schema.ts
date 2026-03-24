import { z } from "zod";
import { absoluteUrlCanBeEmpty } from "../AbsoluteUrl";
import { withAcquisitionSchema } from "../acquisition.dto";
import { addressSchema } from "../address/address.schema";
import { discoverObjective } from "../convention/convention.dto";
import {
  conventionIdSchema,
  immersionObjectiveSchema,
} from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { contactModeSchema } from "../formEstablishment/FormEstablishment.schema";
import { createPaginatedSchema } from "../pagination/pagination.schema";
import { phoneNumberSchema } from "../phone/phone.schema";
import {
  appellationAndRomeDtoSchema,
  appellationCodeSchema,
} from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { makeDateStringSchema } from "../schedule/Schedule.schema";
import { searchTextAlphaNumericSchema } from "../search/searchText.schema";
import { siretSchema } from "../siret/siret.schema";
import {
  firstnameMandatorySchema,
  firstnameSchema,
  lastnameMandatorySchema,
  lastnameSchema,
} from "../user/user.schema";
import {
  MAX_HTML_SIZE,
  zStringMinLength1Max1024,
  zStringMinLength1Max6000,
  zStringMinLength1Max11000,
} from "../utils/string.schema";
import { zUuidLike } from "../utils/uuid";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zToNumber,
} from "../zodUtils";
import {
  type Attachment,
  type CandidateWarnedMethod,
  type CommonDiscussionDto,
  type ContactEstablishmentEventPayload,
  type ContactLevelOfEducation,
  type CreateDiscussion1Eleve1StageDto,
  type CreateDiscussionDto,
  type CreateDiscussionIFDto,
  candidateWarnedMethods,
  contactLevelsOfEducation,
  type DiscussionExchangeForbiddenParams,
  type DiscussionExchangeForbiddenReason,
  type DiscussionId,
  type DiscussionInList,
  type DiscussionReadDto,
  type DiscussionStatus,
  type ExchangeFromDashboard,
  type ExchangeRead,
  type ExchangeRole,
  type FlatGetPaginatedDiscussionsParams,
  type Message,
  type PotentialBeneficiaryCommonProps,
  type WithDiscussionId,
  type WithDiscussionRejection,
  type WithDiscussionStatus,
  type WithDiscussionStatusAccepted,
  type WithDiscussionStatusPending,
  type WithDiscussionStatusRejected,
} from "./discussion.dto";

export const discussionIdSchema: ZodSchemaWithInputMatchingOutput<DiscussionId> =
  z.uuid();
export const withDiscussionIdSchema: ZodSchemaWithInputMatchingOutput<WithDiscussionId> =
  z.object({
    discussionId: discussionIdSchema,
  });

export const exchangeRoles = ["establishment", "potentialBeneficiary"] as const;
export const discussionExchangeForbidenReasons = [
  "user_unknown_or_missing_rights_on_establishment",
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
    name: zStringMinLength1Max1024,
    link: zStringMinLength1Max1024,
  });

// Legacy max message en DB 653522 > reprise des historiques de réponses dans les client mail
// TODO : faire évoluer la gestion de réponse inbound parsing pour retirer l'historique en cas de réponse
// DOMPurify (via isomorphic-dompurify/JSDOM) is extremely slow on large HTML
// (400-700KB emails → 80-240s CPU freeze, causing 504s in production).
// Temporarily bypass DOMPurify for messages until a faster server-side
// sanitization solution is in place. XSS is handled client-side via DOMPurify.
export const messageSchema: ZodSchemaWithInputMatchingOutput<Message> = z
  .string()
  .trim()
  .max(MAX_HTML_SIZE);

export const exchangeReadSchema: ZodSchemaWithInputMatchingOutput<ExchangeRead> =
  z
    .object({
      subject: zStringMinLength1Max1024,
      message: messageSchema,
      sentAt: makeDateStringSchema(),
      attachments: z.array(attachmentSchema),
    })
    .and(
      z.discriminatedUnion("sender", [
        z.object({
          sender: z.literal("establishment"),
          firstname: firstnameSchema,
          lastname: lastnameSchema,
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
      rejectionReason: zStringMinLength1Max1024,
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
const discussionStatusSchema: ZodSchemaWithInputMatchingOutput<DiscussionStatus> =
  z.union([
    discussionAcceptedStatusSchema,
    discussionRejectedStatusSchema,
    discussionPendingStatusSchema,
  ]);
export const discussionStatusesSchema: ZodSchemaWithInputMatchingOutput<
  DiscussionStatus[]
> = z.array(discussionStatusSchema).min(1);

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
  message: messageSchema,
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
  firstName: firstnameMandatorySchema,
  lastName: lastnameMandatorySchema,
  email: emailSchema,
  phone: phoneNumberSchema,
  datePreferences: zStringMinLength1Max6000,
}) satisfies ZodSchemaWithInputMatchingOutput<PotentialBeneficiaryCommonProps>;

const commonDiscussionSchema: ZodSchemaWithInputMatchingOutput<CommonDiscussionDto> =
  z
    .object({
      id: discussionIdSchema,
      createdAt: makeDateStringSchema(),
      updatedAt: makeDateStringSchema(),
      siret: siretSchema,
      businessName: zStringMinLength1Max1024,
      address: addressSchema,
      conventionId: conventionIdSchema.optional(),
    })
    .and(withDiscussionStatusSchema);

const discussionKindIfSchema = z.literal("IF");
const discussionKind1Eleve1StageSchema = z.literal("1_ELEVE_1_STAGE");

const discussionLevelOfEducationSchema = z.enum(["3ème", "2nde"], {
  error: localization.invalidEnum,
});

const resumeLinkSchema = absoluteUrlCanBeEmpty.optional();

export const discussionReadSchema: ZodSchemaWithInputMatchingOutput<DiscussionReadDto> =
  commonDiscussionSchema
    .and(
      z.object({
        appellation: appellationAndRomeDtoSchema,
        exchanges: z.array(exchangeReadSchema),
      }),
    )
    .and(
      z.union([
        z.object({
          contactMode: contactModeSchema,
          kind: discussionKindIfSchema,
          potentialBeneficiary: potentialBeneficiaryCommonSchema.extend({
            immersionObjective: immersionObjectiveSchema.or(z.null()),
            resumeLink: resumeLinkSchema,
            experienceAdditionalInformation:
              zStringMinLength1Max11000.optional(),
          }),
        }),
        z.object({
          contactMode: contactModeSchema,
          kind: discussionKind1Eleve1StageSchema,
          potentialBeneficiary: potentialBeneficiaryCommonSchema.extend({
            immersionObjective: z.literal(discoverObjective),
            levelOfEducation: discussionLevelOfEducationSchema,
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
    search: searchTextAlphaNumericSchema.optional(),
  });

export const discussionInListSchema: ZodSchemaWithInputMatchingOutput<DiscussionInList> =
  z.object({
    id: discussionIdSchema,
    siret: siretSchema,
    status: discussionStatusSchema,
    appellation: appellationAndRomeDtoSchema,
    businessName: zStringMinLength1Max1024,
    createdAt: makeDateStringSchema(),
    kind: z.union([discussionKindIfSchema, discussionKind1Eleve1StageSchema]),
    exchanges: z.array(exchangeReadSchema),
    city: zStringMinLength1Max1024,
    potentialBeneficiary: z.object({
      firstName: firstnameMandatorySchema,
      lastName: lastnameMandatorySchema,
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
    admins: z.array(
      z.object({
        firstName: firstnameSchema,
        lastName: lastnameSchema,
        email: emailSchema,
      }),
    ),
  });

const contactInformationsCommonSchema = z.object({
  appellationCode: appellationCodeSchema,
  siret: siretSchema,
  potentialBeneficiaryFirstName: firstnameMandatorySchema,
  potentialBeneficiaryLastName: lastnameMandatorySchema,
  potentialBeneficiaryEmail: emailSchema,
  locationId: zUuidLike,
});

const createDiscussionCommonSchema = contactInformationsCommonSchema.and(
  z.object({
    potentialBeneficiaryPhone: phoneNumberSchema,
    datePreferences: zStringMinLength1Max6000,
    contactMode: contactModeSchema,
  }),
);

const createDiscussionIFSchema: ZodSchemaWithInputMatchingOutput<CreateDiscussionIFDto> =
  createDiscussionCommonSchema.and(
    z.object({
      kind: z.literal("IF"),
      immersionObjective: immersionObjectiveSchema,
      experienceAdditionalInformation: zStringMinLength1Max1024.optional(),
      potentialBeneficiaryResumeLink: resumeLinkSchema,
    }),
  );

const contactLevelOfEducationSchema: ZodSchemaWithInputMatchingOutput<ContactLevelOfEducation> =
  z.enum(contactLevelsOfEducation, {
    error: localization.invalidEnum,
  });

const createDiscussion1Eleve1StageSchema: ZodSchemaWithInputMatchingOutput<CreateDiscussion1Eleve1StageDto> =
  createDiscussionCommonSchema.and(
    z.object({
      kind: z.literal("1_ELEVE_1_STAGE"),
      immersionObjective: z.literal(discoverObjective),
      levelOfEducation: contactLevelOfEducationSchema,
    }),
  );

export const createDiscussionSchema: ZodSchemaWithInputMatchingOutput<CreateDiscussionDto> =
  createDiscussionIFSchema
    .or(createDiscussion1Eleve1StageSchema)
    .and(withAcquisitionSchema);

export const contactEstablishmentEventPayloadSchema: ZodSchemaWithInputMatchingOutput<ContactEstablishmentEventPayload> =
  z.object({ discussionId: discussionIdSchema, siret: siretSchema });
