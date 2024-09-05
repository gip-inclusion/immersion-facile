import {
  AbsoluteUrl,
  WithSourcePage,
  decodeJwtWithoutSignatureCheck,
  queryParamsAsString,
} from "shared";
import { HttpClient } from "shared-routes";
import { OAuthConfig } from "../../../../../../config/bootstrap/appConfig";
import { validateAndParseZodSchemaV2 } from "../../../../../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../../../../../utils/logger";
import {
  OAuthIdTokenPayload,
  oAuthIdTokenPayloadSchema,
} from "../../entities/OAuthIdTokenPayload";
import {
  GetAccessTokenParams,
  GetAccessTokenResult,
  GetLoginUrlParams,
  OAuthGateway,
  OAuthGatewayProvider,
} from "../../port/OAuthGateway";
import {
  InclusionConnectLogoutQueryParams,
  InclusionConnectRoutes,
} from "./inclusionConnect.routes";
import { ProConnectRoutes } from "./proConnect.routes";

const logger = createLogger(__filename);

export class HttpOAuthGateway implements OAuthGateway {
  private httpClientByProvider: Record<
    OAuthGatewayProvider,
    HttpClient<InclusionConnectRoutes> | HttpClient<ProConnectRoutes>
  >;

  constructor(
    httpClientInclusionConnect: HttpClient<InclusionConnectRoutes>,
    httpClientProConnect: HttpClient<ProConnectRoutes>,
    private inclusionConnectConfig: OAuthConfig,
    private proConnectConfig: OAuthConfig,
  ) {
    this.httpClientByProvider = {
      InclusionConnect: httpClientInclusionConnect,
      ProConnect: httpClientProConnect,
    };
  }

  public async getLoginUrl(
    { nonce, page, state }: GetLoginUrlParams,
    provider: OAuthGatewayProvider,
  ): Promise<AbsoluteUrl> {
    // On pourrait placer ces URL au niveau du ProConnect/InclusionConnect HTTP Client ?
    const uriByMode: Record<OAuthGatewayProvider, AbsoluteUrl> = {
      InclusionConnect: this.#makeInclusionConnectAuthorizeUri(),
      ProConnect: this.#makeProConnectAuthorizeUri(), //TODO a définir
    };
    const baseParams: InclusionConnectLoginUrlParams = {
      state,
      client_id: this.inclusionConnectConfig.clientId,
      nonce,
      redirect_uri: this.#makeRedirectAfterLoginUrl({ page }),
      response_type: "code",
      scope: this.inclusionConnectConfig.scope,
    };
    const queryParams =
      provider === "InclusionConnect"
        ? queryParamsAsString<InclusionConnectLoginUrlParams>(baseParams)
        : queryParamsAsString<ProConnectLoginUrlParams>({
            ...baseParams,
            acr_values: "eidas1",
          });

    return `${uriByMode[provider]}?${queryParams})}`;
  }

  public async getAccessToken(
    { code, page }: GetAccessTokenParams,
    provider: OAuthGatewayProvider,
  ): Promise<GetAccessTokenResult> {
    return this.httpClientByProvider[provider]
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
      .then(
        ({ body }): GetAccessTokenResult => ({
          accessToken: body.access_token,
          expire: body.expires_in,
          oAuthIdTokenPayload: validateAndParseZodSchemaV2(
            oAuthIdTokenPayloadSchema,
            decodeJwtWithoutSignatureCheck<OAuthIdTokenPayload>(body.id_token),
            logger,
          ),
        }),
      )
      .catch((error) => {
        logger.error({
          error,
          message: "Error trying to get Access Token",
        });
        throw error;
      });
  }

  public async getLogoutUrl(
    provider: OAuthGatewayProvider,
  ): Promise<AbsoluteUrl> {
    const uriByMode: Record<OAuthGatewayProvider, AbsoluteUrl> = {
      InclusionConnect: `${this.inclusionConnectConfig.providerBaseUri}/logout/`,
      ProConnect: "http://", // TODO
    };

    return `${
      uriByMode[provider]
    }?${queryParamsAsString<InclusionConnectLogoutQueryParams>({
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

  #makeInclusionConnectAuthorizeUri(): AbsoluteUrl {
    // the following is made in order to support both the old and the new InclusionConnect urls:
    // Base Url was : https://connect.inclusion.beta.gouv.fr/realms/inclusion-connect/protocol/openid-connect
    // OLD : "https://connect.inclusion.beta.gouv.fr/realms/inclusion-connect/protocol/openid-connect/auth"

    // Base Url will be : https://connect.inclusion.beta.gouv.fr/auth
    // NEW : "https://connect.inclusion.beta.gouv.fr/auth/authorize"
    // or : "https://recette.connect.inclusion.beta.gouv.fr/auth/authorize"

    const authorizeInPath =
      this.inclusionConnectConfig.providerBaseUri.includes(
        "connect.inclusion.beta.gouv.fr/auth",
      )
        ? "authorize"
        : "auth";

    return `${this.inclusionConnectConfig.providerBaseUri}/${authorizeInPath}`;
  }

  #makeProConnectAuthorizeUri(): AbsoluteUrl {
    return `${this.proConnectConfig.providerBaseUri}/authorize`;
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

type ProConnectLoginUrlParams = InclusionConnectLoginUrlParams & {
  acr_values: string;
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
