import { defineRoute, defineRoutes } from "shared-routes";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import {
  connectedUserSchema,
  withOptionalUserIdSchema,
} from "../user/user.schema";
import { emptyObjectSchema, expressEmptyResponseBody } from "../zodUtils";
import {
  initiateLoginByEmailParamsSchema,
  oAuthSuccessLoginParamsSchema,
  withIdTokenSchema,
  withRedirectUriSchema,
} from "./auth.schema";

// inclusion connect documentation is here : https://github.com/betagouv/itou-inclusion-connect/blob/master/docs/openid_connect.md#d%C3%A9tail-des-flux

export type AuthRoutes = typeof authRoutes;

export const authRoutes = defineRoutes({
  initiateLoginByOAuth: defineRoute({
    method: "get",
    url: "/login/oauth",
    queryParamsSchema: withRedirectUriSchema,
    responses: {
      302: emptyObjectSchema,
      400: httpErrorSchema,
    },
  }),
  initiateLoginByEmail: defineRoute({
    method: "post",
    url: "/login/email",
    requestBodySchema: initiateLoginByEmailParamsSchema,
    responses: {
      200: expressEmptyResponseBody,
    },
  }),
  afterOAuthSuccessRedirection: defineRoute({
    method: "get",
    url: "/inclusion-connect-after-login", // URI déclarée chez ProConnect, ne pas toucher sauf si on change la config chez ProConnect
    queryParamsSchema: oAuthSuccessLoginParamsSchema,
    responses: {
      302: emptyObjectSchema,
    },
  }),
  getConnectedUser: defineRoute({
    method: "get",
    url: "/inclusion-connected/user",
    ...withAuthorizationHeaders,
    queryParamsSchema: withOptionalUserIdSchema,
    responses: {
      200: connectedUserSchema,
      400: httpErrorSchema,
      401: httpErrorSchema,
    },
  }),
  getOAuthLogoutUrl: defineRoute({
    method: "get",
    url: "/logout/oauth",
    queryParamsSchema: withIdTokenSchema,
    ...withAuthorizationHeaders,
    responses: {
      200: absoluteUrlSchema,
      401: httpErrorSchema,
    },
  }),
});

// -> inclusionConnect button calls startInclusionConnectLogin (immersion)
// -> redirects to inclusionConnect (inclusion)
// -> when logged in, redirects to afterLoginRedirection (immersion)
// -> with code received we can get the access token by calling : inclusionConnectGetAccessToken (inclusion)
//    return is of type {
//      'access_token': <ACCESS_TOKEN>,
//      'token_type': 'Bearer',
//      'expires_in': 60,
//      'id_token': <ID_TOKEN>
//    }
// -> id_token is a JWT. The payload contains the OAuth data of type :
//     nonce : la valeur transmise lors de la requête initiale qu'il faut vérifier.
//     sub : l'identifiant unique de l'utilisateur que le FS doit conserver au cas où l'utilisateur change son adresse e-mail un jour (ce qui n'est pas encore possible pour le moment).
//     given_name : le prénom de l'utilisateur.
//     family_name : son nom de famille.
//     email : so
