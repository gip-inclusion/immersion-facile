import {
  AbsoluteUrl,
  OAuthProvider,
  WithIdToken,
  WithSourcePage,
  decodeJwtWithoutSignatureCheck,
  errors,
  queryParamsAsString,
} from "shared";
import { HttpClient } from "shared-routes";
import { OAuthConfig } from "../../../../../../config/bootstrap/appConfig";
import { validateAndParseZodSchemaV2 } from "../../../../../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../../../../../utils/logger";
import {
  IcOAuthIdTokenPayload,
  ProConnectOAuthIdTokenPayload,
  icAuthTokenPayloadSchema,
  proConnectAuthTokenPayloadSchema,
} from "../../entities/OAuthIdTokenPayload";
import {
  GetAccessTokenParams,
  GetAccessTokenResult,
  GetLoginUrlParams,
  OAuthGateway,
} from "../../port/OAuthGateway";
import {
  InclusionConnectAccessTokenResponse,
  InclusionConnectLogoutQueryParams,
  InclusionConnectRoutes,
  ProConnectLogoutQueryParams,
} from "./inclusionConnect.routes";
import { ProConnectRoutes } from "./proConnect.routes";

const logger = createLogger(__filename);

export class HttpOAuthGateway implements OAuthGateway {
  private httpClientByProvider: {
    ProConnect: HttpClient<ProConnectRoutes>;
    InclusionConnect: HttpClient<InclusionConnectRoutes>;
  };

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
    provider: OAuthProvider,
  ): Promise<AbsoluteUrl> {
    // On pourrait placer ces URL au niveau du ProConnect/InclusionConnect HTTP Client ?
    const uriByMode: Record<OAuthProvider, AbsoluteUrl> = {
      InclusionConnect: this.#makeInclusionConnectAuthorizeUri(),
      ProConnect: this.#makeProConnectAuthorizeUri(),
    };
    const baseParams: Omit<
      InclusionConnectLoginUrlParams,
      "client_id" | "scope"
    > = {
      state,
      nonce,
      redirect_uri: this.#makeRedirectAfterLoginUrl({ page }),
      response_type: "code",
    };
    const queryParams =
      provider === "InclusionConnect"
        ? queryParamsAsString<InclusionConnectLoginUrlParams>({
            ...baseParams,
            client_id: this.inclusionConnectConfig.clientId,
            scope: this.inclusionConnectConfig.scope,
          })
        : queryParamsAsString<ProConnectLoginUrlParams>({
            ...baseParams,
            acr_values: "eidas1",
            client_id: this.proConnectConfig.clientId,
            scope: this.proConnectConfig.scope,
          });

    return `${uriByMode[provider]}?${queryParams}`;
  }

  async #getAccessTokenProConnect({
    code,
    page,
  }: GetAccessTokenParams): Promise<GetAccessTokenResult> {
    const queryParams = {
      body: queryParamsAsString({
        code,
        client_id: this.proConnectConfig.clientId,
        client_secret: this.proConnectConfig.clientSecret,
        grant_type: "authorization_code",
        redirect_uri: this.#makeRedirectAfterLoginUrl({ page }),
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded" as const,
      },
    };

    const { body: proConnectAccessTokenBody } =
      await this.httpClientByProvider.ProConnect.getAccessToken(queryParams);

    const { nonce } = decodeJwtWithoutSignatureCheck<{ nonce: string }>(
      proConnectAccessTokenBody.id_token,
    );

    const response = await this.httpClientByProvider.ProConnect.getUserInfo({
      headers: {
        authorization: `Bearer ${proConnectAccessTokenBody.access_token}`,
      },
    });

    if (response.status === 400)
      throw errors.inclusionConnect.couldNotGetUserInfo({
        message: JSON.stringify(response.body, null, 2),
      });

    const tokenWithPayload = response.body;
    const oAuthIdTokenPayload = validateAndParseZodSchemaV2(
      proConnectAuthTokenPayloadSchema,
      decodeJwtWithoutSignatureCheck<ProConnectOAuthIdTokenPayload>(
        tokenWithPayload,
      ),
      logger,
    );

    return {
      accessToken: proConnectAccessTokenBody.access_token,
      idToken: proConnectAccessTokenBody.id_token,
      expire: proConnectAccessTokenBody.expires_in,
      payload: {
        sub: oAuthIdTokenPayload.sub,
        nonce,
        firstName: oAuthIdTokenPayload.given_name,
        lastName: oAuthIdTokenPayload.usual_name,
        email: oAuthIdTokenPayload.email,
        // structure_pe: "TODO"
      },
    };
  }

  async #getAccessTokenInclusionConnect({
    code,
    page,
  }: GetAccessTokenParams): Promise<GetAccessTokenResult> {
    const queryParams = {
      body: queryParamsAsString({
        code,
        client_id: this.inclusionConnectConfig.clientId,
        client_secret: this.inclusionConnectConfig.clientSecret,
        grant_type: "authorization_code",
        redirect_uri: this.#makeRedirectAfterLoginUrl({ page }),
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded" as const,
      },
    };

    try {
      const { body: inclusionConnectAccessTokenBody } =
        await this.httpClientByProvider.InclusionConnect.getAccessToken(
          queryParams,
        );

      const tokenWithPayload = inclusionConnectAccessTokenBody.id_token;

      const oAuthIdTokenPayload = validateAndParseZodSchemaV2(
        icAuthTokenPayloadSchema,
        decodeJwtWithoutSignatureCheck<IcOAuthIdTokenPayload>(tokenWithPayload),
        logger,
      );

      return {
        accessToken: inclusionConnectAccessTokenBody.access_token,
        expire: inclusionConnectAccessTokenBody.expires_in,
        idToken: tokenWithPayload,
        payload: {
          sub: oAuthIdTokenPayload.sub,
          lastName: oAuthIdTokenPayload.family_name,
          firstName: oAuthIdTokenPayload.given_name,
          nonce: oAuthIdTokenPayload.nonce,
          email: oAuthIdTokenPayload.email,
          structure_pe: oAuthIdTokenPayload.structure_pe,
        },
      };
    } catch (error: any) {
      logger.error({
        error,
        message: "Error trying to get Access Token",
      });
      throw error;
    }
  }

  public async getAccessToken(
    { code, page }: GetAccessTokenParams,
    provider: OAuthProvider,
  ): Promise<GetAccessTokenResult> {
    return provider === "InclusionConnect"
      ? this.#getAccessTokenInclusionConnect({ code, page })
      : this.#getAccessTokenProConnect({ code, page });
  }

  public async getLogoutUrl(
    params: WithIdToken,
    provider: OAuthProvider,
  ): Promise<AbsoluteUrl> {
    const uri: AbsoluteUrl =
      provider === "InclusionConnect"
        ? `${this.inclusionConnectConfig.providerBaseUri}/logout/`
        : `${this.proConnectConfig.providerBaseUri}/session/end/`;

    return provider === "InclusionConnect"
      ? `${uri}?${queryParamsAsString<InclusionConnectLogoutQueryParams>({
          client_id: this.inclusionConnectConfig.clientId,
          post_logout_redirect_uri:
            this.inclusionConnectConfig.immersionRedirectUri.afterLogout,
          id_token: params.idToken,
        })}`
      : `${uri}?${queryParamsAsString<ProConnectLogoutQueryParams>({
          post_logout_redirect_uri:
            this.inclusionConnectConfig.immersionRedirectUri.afterLogout,
          id_token_hint: params.idToken,
          state:
            "3b7bd7fb38ccab89864563f17a89c4cb3bd400164ce828b4cfc2cb01ce8ed9da",
        })}`;
  }

  async #getTokenWithPayload(
    provider: OAuthProvider,
    inclusionConnectAccessTokenBody: InclusionConnectAccessTokenResponse,
  ): Promise<string> {
    if (provider === "InclusionConnect")
      return inclusionConnectAccessTokenBody.id_token;

    const response = await this.httpClientByProvider.ProConnect.getUserInfo({
      headers: {
        authorization: `Bearer ${inclusionConnectAccessTokenBody.access_token}`,
      },
    });

    if (response.status === 400)
      throw errors.inclusionConnect.couldNotGetUserInfo({
        message: JSON.stringify(response.body, null, 2),
      });

    return response.body;
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
