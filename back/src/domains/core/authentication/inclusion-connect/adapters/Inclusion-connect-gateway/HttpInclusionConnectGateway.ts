import { decodeJwtWithoutSignatureCheck, queryParamsAsString } from "shared";
import { HttpClient } from "shared-routes";
import { createLogger } from "../../../../../../utils/logger";
import { InclusionConnectIdTokenPayload } from "../../entities/InclusionConnectIdTokenPayload";
import {
  GetAccessTokenParams,
  GetAccessTokenResult,
  InclusionConnectGateway,
} from "../../port/InclusionConnectGateway";
import { InclusionConnectConfig } from "../../use-cases/InitiateInclusionConnect";
import { InclusionConnectExternalRoutes } from "./inclusionConnectExternalRoutes";

const logger = createLogger(__filename);

export class HttpInclusionConnectGateway implements InclusionConnectGateway {
  constructor(
    private httpClient: HttpClient<InclusionConnectExternalRoutes>,
    private inclusionConnectConfig: InclusionConnectConfig,
  ) {}

  public async getAccessToken({
    code,
    redirectUri,
  }: GetAccessTokenParams): Promise<GetAccessTokenResult> {
    return this.httpClient
      .inclusionConnectGetAccessToken({
        body: queryParamsAsString({
          code,
          client_id: this.inclusionConnectConfig.clientId,
          client_secret: this.inclusionConnectConfig.clientSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then(({ body }) => ({
        accessToken: body.access_token,
        expire: body.expires_in,
        icIdTokenPayload:
          decodeJwtWithoutSignatureCheck<InclusionConnectIdTokenPayload>(
            body.id_token,
          ),
      }))
      .catch((error) => {
        logger.error({
          body: error?.response?.data,
          message: "Error trying to get Access Token",
        });
        throw error;
      });
  }
}

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
// // this token is for test purpose :

// export const jwtGeneratedTokenFromFakeInclusionPayload =
//   "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Im5vdW5jZSIsInN1YiI6Im15LXVzZXItaWQiLCJnaXZlbl9uYW1lIjoiSm9obiIsImZhbWlseV9uYW1lIjoiRG9lIiwiZW1haWwiOiJqb2huLmRvZUBpbmNsdXNpb24uY29tIn0.kHy9LewhgXGVPy9rwcRea6LufhvgBb4zpcXa_H0-fEHIQk6ZhMATHL3LR1bgYqAo4IBU-cg1HYEbiOYMVPd4kg";

// // JWT contains the following payload :

// export const fakeInclusionPayload = {
//   nonce: "nounce",
//   sub: "my-user-id",
//   given_name: "John",
//   family_name: "Doe",
//   email: "john.doe@inclusion.com",
// };

// export const defaultInclusionAccessTokenResponse: InclusionAccessTokenResponse =
//   {
//     token_type: "Bearer",
//     expires_in: 60,
//     access_token: "initial-access-token",
//     id_token: jwtGeneratedTokenFromFakeInclusionPayload,
//   };
