import { emailSchema, zStringMinLength1 } from "shared";
import { z } from "zod";
import { BearerToken } from "../../dto/BearerToken";
import {
  PeConnectAdvisorsKind,
  peAdvisorKinds,
} from "../../dto/PeConnectAdvisor.dto";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectAdvisors,
  ExternalPeConnectStatut,
  ExternalPeConnectUser,
  PeConnectHeaders,
} from "./peConnectApi.dto";

export const externalPeConnectUserSchema: z.Schema<ExternalPeConnectUser> =
  z.object({
    email: emailSchema.optional(),
    family_name: zStringMinLength1,
    gender: z.enum(["male", "female"]),
    given_name: zStringMinLength1,
    idIdentiteExterne: zStringMinLength1,
    sub: zStringMinLength1,
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
    nom: zStringMinLength1,
    prenom: zStringMinLength1,
    civilite: z.enum(["1", "2"]),
    mail: emailSchema,
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
