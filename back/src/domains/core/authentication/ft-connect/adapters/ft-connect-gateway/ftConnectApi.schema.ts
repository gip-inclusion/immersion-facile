import { emailSchema, zStringMinLength1 } from "shared";
import { z } from "zod";
import { BearerToken } from "../../dto/BearerToken";
import {
  FtConnectAdvisorsKind,
  ftAdvisorKinds,
} from "../../dto/FtConnectAdvisor.dto";
import {
  ExternalFtConnectAdvisor,
  ExternalFtConnectStatut,
  ExternalFtConnectUser,
  FtConnectHeaders,
} from "./ftConnectApi.dto";

export const externalFtConnectUserSchema: z.Schema<ExternalFtConnectUser> =
  z.object({
    email: emailSchema.optional(),
    family_name: zStringMinLength1,
    gender: z.enum(["male", "female"]),
    given_name: zStringMinLength1,
    idIdentiteExterne: zStringMinLength1,
    sub: zStringMinLength1,
  });

export const externalFtConnectUserStatutSchema: z.Schema<ExternalFtConnectStatut> =
  z.object({
    codeStatutIndividu: z.enum(["0", "1"]),
    libelleStatutIndividu: z.enum([
      "Non demandeur d’emploi",
      "Demandeur d’emploi",
    ]),
  });

const ftAdvisorKindSchema: z.Schema<FtConnectAdvisorsKind> =
  z.enum(ftAdvisorKinds);

const externalftConnectAdvisorSchema: z.Schema<ExternalFtConnectAdvisor> =
  z.object({
    nom: zStringMinLength1,
    prenom: zStringMinLength1,
    civilite: z.enum(["1", "2"]),
    mail: emailSchema,
    type: ftAdvisorKindSchema,
  });

export const externalFtConnectAdvisorsSchema: z.Schema<
  ExternalFtConnectAdvisor[]
> = z.array(externalftConnectAdvisorSchema);

const bearerSchema = z.string().regex(/^Bearer .+$/) as z.Schema<BearerToken>;

export const ftConnectHeadersSchema: z.Schema<FtConnectHeaders> = z
  .object({
    "Content-Type": z.literal("application/json"),
    Accept: z.literal("application/json"),
    Authorization: bearerSchema,
  })
  .passthrough();
