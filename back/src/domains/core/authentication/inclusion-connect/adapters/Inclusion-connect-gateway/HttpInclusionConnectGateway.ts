import {
  AbsoluteUrl,
  WithSourcePage,
  decodeJwtWithoutSignatureCheck,
  queryParamsAsString,
} from "shared";
import { HttpClient } from "shared-routes";
import { InclusionConnectConfig } from "../../../../../../config/bootstrap/appConfig";
import { validateAndParseZodSchemaV2 } from "../../../../../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../../../../../utils/logger";
import {
  InclusionConnectIdTokenPayload,
  inclusionConnectIdTokenPayloadSchema,
} from "../../entities/InclusionConnectIdTokenPayload";
import {
  GetAccessTokenParams,
  GetAccessTokenResult,
  GetLoginUrlParams,
  InclusionConnectGateway,
} from "../../port/InclusionConnectGateway";
import {
  InclusionConnectLogoutQueryParams,
  InclusionConnectRoutes,
} from "./inclusionConnect.routes";

const logger = createLogger(__filename);

export class HttpInclusionConnectGateway implements InclusionConnectGateway {
  constructor(
    private httpClientInclusionConnect: HttpClient<InclusionConnectRoutes>,
    private inclusionConnectConfig: InclusionConnectConfig,
  ) {}

  public async getLoginUrl({
    nonce,
    page,
    state,
  }: GetLoginUrlParams): Promise<AbsoluteUrl> {
    return `${this.makeInclusionConnectAuthorizeUri()}?${queryParamsAsString<InclusionConnectLoginUrlParams>(
      {
        client_id: this.inclusionConnectConfig.clientId,
        nonce,
        redirect_uri: this.#makeRedirectAfterLoginUrl({ page }),
        response_type: "code",
        scope: this.inclusionConnectConfig.scope,
        state,
      },
    )}`;
  }

  private makeInclusionConnectAuthorizeUri(): AbsoluteUrl {
    // the following is made in order to support both the old and the new InclusionConnect urls:
    // Base Url was : https://connect.inclusion.beta.gouv.fr/realms/inclusion-connect/protocol/openid-connect
    // OLD : "https://connect.inclusion.beta.gouv.fr/realms/inclusion-connect/protocol/openid-connect/auth"

    // Base Url will be : https://connect.inclusion.beta.gouv.fr/auth
    // NEW : "https://connect.inclusion.beta.gouv.fr/auth/authorize"
    // or : "https://recette.connect.inclusion.beta.gouv.fr/auth/authorize"

    const authorizeInPath =
      this.inclusionConnectConfig.inclusionConnectBaseUri.includes(
        "connect.inclusion.beta.gouv.fr/auth",
      )
        ? "authorize"
        : "auth";

    return `${this.inclusionConnectConfig.inclusionConnectBaseUri}/${authorizeInPath}`;
  }

  public async getAccessToken({
    code,
    page,
  }: GetAccessTokenParams): Promise<GetAccessTokenResult> {
    return this.httpClientInclusionConnect
      .getAccessToken({
        body: queryParamsAsString({
          code,
          client_id: this.inclusionConnectConfig.clientId,
          client_secret: this.inclusionConnectConfig.clientSecret,
          grant_type: "authorization_code",
          redirect_uri: this.#makeRedirectAfterLoginUrl({ page }),
        }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
      .then(({ body }) => ({
        accessToken: body.access_token,
        expire: body.expires_in,
        icIdTokenPayload: validateAndParseZodSchemaV2(
          inclusionConnectIdTokenPayloadSchema,
          decodeJwtWithoutSignatureCheck<InclusionConnectIdTokenPayload>(
            body.id_token,
          ),
          logger,
        ),
      }))
      .catch((error) => {
        logger.error({
          error,
          message: "Error trying to get Access Token",
        });
        throw error;
      });
  }

  public async getLogoutUrl(): Promise<AbsoluteUrl> {
    return `${
      this.inclusionConnectConfig.inclusionConnectBaseUri
    }/logout/?${queryParamsAsString<InclusionConnectLogoutQueryParams>({
      client_id: this.inclusionConnectConfig.clientId,
      post_logout_redirect_uri:
        this.inclusionConnectConfig.immersionRedirectUri.afterLogout,
    })}`;
  }

  #makeRedirectAfterLoginUrl(params: WithSourcePage): AbsoluteUrl {
    return `${
      this.inclusionConnectConfig.immersionRedirectUri.afterLogin
    }?${queryParamsAsString<WithSourcePage>(params)}`;
  }
}

type InclusionConnectLoginUrlParams = {
  response_type: "code";
  client_id: string;
  redirect_uri: AbsoluteUrl;
  scope: string;
  state: string;
  nonce: string;
  login_hint?: string;
};

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
