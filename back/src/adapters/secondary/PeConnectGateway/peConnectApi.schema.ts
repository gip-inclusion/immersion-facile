import { zTrimmedString } from "shared";
import { z } from "zod";
import { peAdvisorImmersionKinds } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectStatut,
  ExternalPeConnectUser,
} from "./peConnectApi.dto";

export const externalPeConnectUserSchema: z.Schema<ExternalPeConnectUser> =
  z.object({
    email: z
      .string()
      .email("L'addresse email pole emploi doit être remplie valide"),
    family_name: zTrimmedString,
    gender: z.enum(["male", "female"]),
    given_name: zTrimmedString,
    idIdentiteExterne: z.string().uuid(),
    sub: z.string().uuid(),
  });

export const externalPeConnectUserStatutSchema: z.Schema<ExternalPeConnectStatut> =
  z.object({
    codeStatutIndividu: z.enum(["0", "1"]),
    libelleStatutIndividu: z.enum([
      "Non demandeur d'emploi",
      "Demandeur d'emploi",
    ]),
  });

export const externalPeConnectAdvisorSchema: z.Schema<ExternalPeConnectAdvisor> =
  z.object({
    nom: zTrimmedString,
    prenom: zTrimmedString,
    civilite: z.enum(["1", "2"]),
    mail: z.string().email("L'addresse email du conseillé doit être valide"),
    type: z.enum(peAdvisorImmersionKinds),
  });

export const externalPeConnectAdvisorsSchema: z.Schema<
  ExternalPeConnectAdvisor[]
> = z.array(externalPeConnectAdvisorSchema);
