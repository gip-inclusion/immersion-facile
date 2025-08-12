import { emailSchema, localization, zStringMinLength1 } from "shared";
import { z } from "zod";
import type { BearerToken } from "../../dto/BearerToken";
import {
  type FtConnectAdvisorsKind,
  ftAdvisorKinds,
} from "../../dto/FtConnectAdvisor.dto";
import type {
  ExternalFtConnectAdvisor,
  ExternalFtConnectStatut,
  ExternalFtConnectUser,
  FtConnectHeaders,
} from "./ftConnectApi.dto";

export const externalFtConnectUserSchema: z.Schema<ExternalFtConnectUser> =
  z.object({
    email: emailSchema.optional(),
    family_name: zStringMinLength1,
    gender: z.enum(["male", "female"], {
      error: localization.invalidEnum,
    }),
    given_name: zStringMinLength1,
    idIdentiteExterne: zStringMinLength1,
    sub: zStringMinLength1,
  });

export const externalFtConnectUserStatutSchema: z.Schema<ExternalFtConnectStatut> =
  z.object({
    codeStatutIndividu: z.enum(["0", "1"], {
      error: localization.invalidEnum,
    }),
    libelleStatutIndividu: z.enum(
      ["Non demandeur d’emploi", "Demandeur d’emploi"],
      {
        error: localization.invalidEnum,
      },
    ),
  });

const ftAdvisorKindSchema: z.Schema<FtConnectAdvisorsKind> = z.enum(
  ftAdvisorKinds,
  {
    error: localization.invalidEnum,
  },
);

const externalftConnectAdvisorSchema: z.Schema<ExternalFtConnectAdvisor> =
  z.object({
    nom: zStringMinLength1,
    prenom: zStringMinLength1,
    civilite: z.enum(["1", "2"], {
      error: localization.invalidEnum,
    }),
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
  .loose();
