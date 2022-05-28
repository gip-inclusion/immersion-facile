import { zString, zTrimmedString } from "shared/src/zodUtils";
import { z } from "zod";
import { ExternalAccessToken } from "../dto/AccessToken.dto";
import {
  conventionPoleEmploiAdvisorTypes,
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
  peExternalAdvisorsTypes,
  PoleEmploiUserAdvisorDTO,
} from "../dto/PeConnect.dto";

export const externalAccessTokenSchema: z.Schema<ExternalAccessToken> =
  z.object({
    access_token: zString
      .transform((s) => s.trim())
      .refine((s) => s.length > 0, "Le format du token peConnect est invalide"),
    expires_in: z.number().min(1, "Ce token est déja expiré"),
  });

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
    civilite: z.enum(["0", "1"]),
    mail: z.string().email("L'addresse email du conseillé doit être valide"),
    type: z.enum(peExternalAdvisorsTypes),
  });

export const externalPeConnectAdvisorsSchema: z.Schema<
  ExternalPeConnectAdvisor[]
> = z.array(externalPeConnectAdvisorSchema);

// TODO on peut typer ça ??? s.ZodAny | z.ZodString | z.ZodEffect<any, any, any>
// typer avec { [key: string]: any } cause une erreur sur les schema au z.object(...)
const shape = {
  userPeExternalId: z.string().uuid(),
  firstName: z
    .string()
    .transform((s) => s.trim())
    .refine(
      (s) => s.length > 0,
      "Le prénom du conseiller ne peut pas être vide",
    ),
  lastName: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "Le nom du conseiller ne peut pas être vide"),
  email: z.string().email("L'email du conseiller est invalide"),
  type: z.enum(conventionPoleEmploiAdvisorTypes),
};

export const poleEmploiUserAdvisorEntitySchema: z.Schema<PoleEmploiUserAdvisorDTO> =
  z.object(shape);

export const PoleEmploiUserAdvisorDTOSchema: z.Schema<PoleEmploiUserAdvisorDTO> =
  z
    .object({
      id: z.string().uuid(),
    })
    .merge(z.object(shape));
