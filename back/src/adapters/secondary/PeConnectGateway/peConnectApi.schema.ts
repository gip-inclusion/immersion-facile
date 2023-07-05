import { z } from "zod";
import { zString, zTrimmedString } from "shared";
import { BearerToken } from "../../../domain/peConnect/dto/BearerToken";
import {
  peAdvisorKinds,
  PeConnectAdvisorsKind,
} from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectAdvisors,
  ExternalPeConnectStatut,
  ExternalPeConnectUser,
  PeConnectHeaders,
} from "./peConnectApi.dto";

export const externalPeConnectUserSchema: z.Schema<ExternalPeConnectUser> =
  z.object({
    email: z
      .string()
      .email("L'addresse email pole emploi doit être remplie valide")
      .optional(),
    family_name: zTrimmedString,
    gender: z.enum(["male", "female"]),
    given_name: zTrimmedString,
    idIdentiteExterne: zString,
    sub: zString,
  });

export const externalPeConnectUserStatutSchema: z.Schema<ExternalPeConnectStatut> =
  z.object({
    codeStatutIndividu: z.enum(["0", "1"]),
    libelleStatutIndividu: z.enum([
      "Non demandeur d’emploi",
      "Demandeur d’emploi",
    ]),
  });

const peAdvisorKindSchema: z.Schema<PeConnectAdvisorsKind> =
  z.enum(peAdvisorKinds);

const externalPeConnectAdvisorSchema: z.Schema<ExternalPeConnectAdvisor> =
  z.object({
    nom: zTrimmedString,
    prenom: zTrimmedString,
    civilite: z.enum(["1", "2"]),
    mail: z.string().email("L'addresse email du conseillé doit être valide"),
    type: peAdvisorKindSchema,
  });

export const externalPeConnectAdvisorsSchema: z.Schema<ExternalPeConnectAdvisors> =
  z.array(externalPeConnectAdvisorSchema);

const bearerSchema = z.string().regex(/^Bearer .+$/) as z.Schema<BearerToken>;

export const peConnectHeadersSchema: z.Schema<PeConnectHeaders> = z
  .object({
    "Content-Type": z.literal("application/json"),
    Accept: z.literal("application/json"),
    Authorization: bearerSchema,
  })
  .passthrough();
