import { Email, ExternalId, emailSchema } from "shared";
import { z } from "zod";

type ProviderTokenPayloadBase = {
  sub: ExternalId;
  given_name: string;
  email: Email;
  structure_pe?: string;
};

export type IcOAuthIdTokenPayload = ProviderTokenPayloadBase & {
  nonce: string;
  family_name: string;
};

export type ProConnectOAuthIdTokenPayload = ProviderTokenPayloadBase & {
  usual_name: string;
};

export const icAuthTokenPayloadSchema: z.Schema<IcOAuthIdTokenPayload> =
  z.object({
    nonce: z.string(),
    sub: z.string(),
    given_name: z.string(),
    family_name: z.string(),
    email: emailSchema,
    structure_pe: z.string().optional(),
  });

export const proConnectAuthTokenPayloadSchema: z.Schema<ProConnectOAuthIdTokenPayload> =
  z.object({
    sub: z.string(),
    given_name: z.string(),
    usual_name: z.string(),
    email: emailSchema,
    structure_pe: z.string().optional(),
  });

// 2 versions :

// IC connect

// Bouton IC Connect (immersion-facile.com)
// Redirige sur la page de login IC --> inclusion-connect.com/authorize ( en précisant le callback : ? callbackUrl=if-back.com/ic-after-login)
// Récupérer le jwt token que l'on décode pour récup les infos du user --> getAccessToken
// redirige vers le front, authentifié avec un tocken que l'on génère, authentifie l'utilisateur

// Pro Connect
// Redirige sur la page de login Pro Connect --> pro-connect.com/authorize ( en précisant le callback : ? callbackUrl=if-back.com/ic-after-login)
// Récupérer un jwt token
// appel de /user-info en envoyant le token récupéré précédemment pour récup les infos du user
// redirige vers le front, authentifié avec un tocken que l'on génère, authentifie l'utilisateur
