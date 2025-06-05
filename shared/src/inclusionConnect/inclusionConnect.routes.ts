import { defineRoute, defineRoutes } from "shared-routes";
import { emptyObjectSchema, expressEmptyResponseBody } from "../zodUtils";
import {
  authenticateWithOAuthCodeSchema,
  initiateLoginByEmailParamsSchema,
  withSourcePageSchema,
} from "./inclusionConnect.schema";

// inclusion connect documentation is here : https://github.com/betagouv/itou-inclusion-connect/blob/master/docs/openid_connect.md#d%C3%A9tail-des-flux

export type InclusionConnectImmersionRoutes =
  typeof inclusionConnectImmersionRoutes;
export const inclusionConnectImmersionRoutes = defineRoutes({
  startInclusionConnectLogin: defineRoute({
    method: "get",
    url: "/inclusion-connect-start-login",
    queryParamsSchema: withSourcePageSchema,
    responses: {
      302: emptyObjectSchema,
    },
  }),
  afterLoginRedirection: defineRoute({
    method: "get",
    url: "/inclusion-connect-after-login",
    queryParamsSchema: authenticateWithOAuthCodeSchema,
    responses: {
      302: emptyObjectSchema,
    },
  }),
  initiateLoginByEmail: defineRoute({
    method: "post",
    url: "/initiate-login-by-email",
    requestBodySchema: initiateLoginByEmailParamsSchema,
    responses: {
      200: expressEmptyResponseBody,
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
