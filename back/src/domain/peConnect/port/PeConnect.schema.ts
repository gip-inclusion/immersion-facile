import { makezTrimmedString, zTrimmedString } from "shared";
import { z } from "zod";
import {
  conventionPoleEmploiAdvisors,
  ConventionPoleEmploiUserAdvisorDto,
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
  peExternalAdvisorsTypes,
} from "../dto/PeConnect.dto";
import { ConventionAndPeExternalIds } from "./ConventionPoleEmploiAdvisorRepository";

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

export const externalPeConnectAdvisorSchema: z.Schema<ExternalPeConnectAdvisor> =
  z.object({
    nom: zTrimmedString,
    prenom: zTrimmedString,
    civilite: z.enum(["1", "2"]),
    mail: z.string().email("L'addresse email du conseillé doit être valide"),
    type: z.enum(peExternalAdvisorsTypes),
  });

export const externalPeConnectAdvisorsSchema: z.Schema<
  ExternalPeConnectAdvisor[]
> = z.array(externalPeConnectAdvisorSchema);

export const conventionPoleEmploiUserAdvisorDtoSchema: z.Schema<ConventionPoleEmploiUserAdvisorDto> =
  z.object({
    userPeExternalId: z.string().uuid(),
    conventionId: z.string().uuid(),
    firstName: makezTrimmedString(
      "Le prénom du conseiller ne peut pas être vide",
    ),
    lastName: makezTrimmedString("Le nom du conseiller ne peut pas être vide"),
    email: z.string().email("L'email du conseiller est invalide"),
    type: z.enum(conventionPoleEmploiAdvisors),
  });

export const conventionPoleEmploiUserAdvisorIdsSchema: z.Schema<ConventionAndPeExternalIds> =
  z.object({
    peExternalId: z.string().uuid(),
    conventionId: z.string().uuid(),
  });
