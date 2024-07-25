import { emailSchema, numberOfEmployeesRangeSchema } from "shared";
import { z } from "zod";
import {
  CreateContactAttributes,
  CreateContactBody,
  DeleteContactFromListModeEmailResponseBody,
  DeleteContactFromListRequestBodyModeEmail,
  GetContactInfoAttributes,
  GetContactInfoResponseBody,
  typesPublic,
} from "./BrevoContact.dto";

const createContactAttributesSchema: z.Schema<CreateContactAttributes> =
  z.object({
    EMAIL: z.string().or(z.literal("")).optional(),
    ENT_CODE_DEPARTEMENT: z.string().or(z.literal("")).optional(),
    ENT_CODE_NAF: z.string().or(z.literal("")).optional(),
    ENT_COMPTE_IC: z.boolean().or(z.literal("")).optional(),
    ENT_DATE_DISPO: z.string().or(z.literal("")).optional(),
    ENT_DATE_FIN_DERNIERE_CONVENTION: z.string().or(z.literal("")).optional(),
    ENT_DATE_PREM_CONVENTION: z.string().or(z.literal("")).optional(),
    ENT_DATE_VALIDATION_DERNIERE_CONVENTION: z
      .string()
      .or(z.literal(""))
      .optional(),
    ENT_EFFECTIF: numberOfEmployeesRangeSchema.or(z.literal("")).optional(),
    ENT_FONCTION: z.string().or(z.literal("")).optional(),
    ENT_LES_ENTREPRISES_SENGAGENT: z.boolean().or(z.literal("")).optional(),
    ENT_MAX_CONTACTS_PER_MONTH: z.number().int().or(z.literal("")).optional(),
    ENT_NAF: z.string().or(z.literal("")).optional(),
    ENT_NB_CONVENTION: z.number().int().or(z.literal("")).optional(),
    ENT_NOMBRE_MER_RECUES: z.number().int().or(z.literal("")).optional(),
    ENT_NOMBRE_REPONSES_MER: z.number().int().or(z.literal("")).optional(),
    ENT_REFERENCE_SITE: z.boolean().or(z.literal("")).optional(),
    ENT_ROMES: z.string().or(z.literal("")).optional(),
    ENT_SECTEUR: z.string().or(z.literal("")).optional(),
    ENT_SIRET: z.string().or(z.literal("")).optional(),
    ENT_TYPE_PUBLIC_ACCUEILLIS: z
      .enum(typesPublic)
      .or(z.literal(""))
      .optional(),
    NOM: z.string().or(z.literal("")).optional(),
    PRENOM: z.string().or(z.literal("")).optional(),
  });

export const createContactBodySchema: z.Schema<CreateContactBody> = z
  .object({
    email: z.string().optional(),
    ext_id: z.string().optional(),
    attributes: createContactAttributesSchema.optional(),
    emailBlacklisted: z.boolean().optional(),
    smsBlacklisted: z.boolean().optional(),
    listIds: z.array(z.number()).optional(),
  })
  .and(
    z.discriminatedUnion("updateEnabled", [
      z.object({
        updateEnabled: z.literal(false),
      }),
      z.object({
        updateEnabled: z.literal(true),
        smtpBlacklistSender: z.array(z.string()).optional(),
      }),
    ]),
  );

const getContactInfoAttributesSchema: z.Schema<GetContactInfoAttributes> =
  z.object({
    EMAIL: z.string().optional(),
    ENT_CODE_DEPARTEMENT: z.string().optional(),
    ENT_CODE_NAF: z.string().optional(),
    ENT_COMPTE_IC: z.boolean().optional(),
    ENT_DATE_DISPO: z.string().optional(),
    ENT_DATE_FIN_DERNIERE_CONVENTION: z.string().optional(),
    ENT_DATE_PREM_CONVENTION: z.string().optional(),
    ENT_DATE_VALIDATION_DERNIERE_CONVENTION: z.string().optional(),
    ENT_EFFECTIF: numberOfEmployeesRangeSchema.optional(),
    ENT_FONCTION: z.string().optional(),
    ENT_LES_ENTREPRISES_SENGAGENT: z.boolean().optional(),
    ENT_MAX_CONTACTS_PER_MONTH: z.number().int().optional(),
    ENT_NAF: z.string().optional(),
    ENT_NB_CONVENTION: z.number().int().optional(),
    ENT_NOMBRE_MER_RECUES: z.number().int().optional(),
    ENT_NOMBRE_REPONSES_MER: z.number().int().optional(),
    ENT_REFERENCE_SITE: z.boolean().optional(),
    ENT_ROMES: z.string().optional(),
    ENT_SECTEUR: z.string().optional(),
    ENT_SIRET: z.string().optional(),
    ENT_TYPE_PUBLIC_ACCUEILLIS: z.enum(typesPublic).optional(),
    NOM: z.string().optional(),
    PRENOM: z.string().optional(),
  });

export const getContactInfoResponseBodySchema: z.Schema<GetContactInfoResponseBody> =
  z.object({
    email: z.string(),
    id: z.number(),
    emailBlacklisted: z.boolean(),
    smsBlacklisted: z.boolean(),
    createdAt: z.string(),
    modifiedAt: z.string(),
    listIds: z.array(z.number()),
    attributes: getContactInfoAttributesSchema,
  });

export const contactErrorResponseBodySchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const deleteContactFromListBodyRequestModeEmailSchema: z.Schema<DeleteContactFromListRequestBodyModeEmail> =
  z.object({
    emails: z.array(emailSchema),
  });
export const deleteContactFromListModeEmailResponseBodySchema: z.Schema<DeleteContactFromListModeEmailResponseBody> =
  z.object({
    contacts: z.object({
      success: z.array(emailSchema),
      failure: z.array(emailSchema),
    }),
  });
