import {
  AbsoluteUrl,
  OAuthGatewayProvider,
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
  GetLogoutUrlParams,
  OAuthGateway,
} from "../../port/OAuthGateway";
import { InclusionConnectRoutes } from "./inclusionConnect.routes";
import { ProConnectRoutes } from "./proConnect.routes";

export type OAuthLogoutQueryParams = {
  post_logout_redirect_uri: AbsoluteUrl;
  id_token_hint: string;
  state: string;
};

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
    provider: OAuthGatewayProvider,
  ): Promise<AbsoluteUrl> {
    const uriByProvider: Record<OAuthGatewayProvider, AbsoluteUrl> = {
      inclusionConnect: this.#makeInclusionConnectAuthorizeUri(),
      proConnect: this.#makeProConnectAuthorizeUri(),
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
      provider === "inclusionConnect"
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

    return `${uriByProvider[provider]}?${queryParams}`;
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

    const tokenPayload =
      decodeJwtWithoutSignatureCheck<ProConnectOAuthIdTokenPayload>(
        tokenWithPayload,
      );

    const oAuthIdTokenPayload = validateAndParseZodSchemaV2(
      proConnectAuthTokenPayloadSchema,
      tokenPayload,
      logger,
    );

    logger.info({
      message: `from ProConnect:
       custom before parsing : ${JSON.stringify(tokenPayload.custom)},
       sub: ${oAuthIdTokenPayload.sub},
       custom after parsing: ${JSON.stringify(oAuthIdTokenPayload.custom)}`,
    });

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
        structure_pe: oAuthIdTokenPayload.custom.structure_travail,
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
    provider: OAuthGatewayProvider,
  ): Promise<GetAccessTokenResult> {
    return provider === "inclusionConnect"
      ? this.#getAccessTokenInclusionConnect({ code, page })
      : this.#getAccessTokenProConnect({ code, page });
  }

  public async getLogoutUrl(
    params: GetLogoutUrlParams,
    provider: OAuthGatewayProvider,
  ): Promise<AbsoluteUrl> {
    const uri: AbsoluteUrl =
      provider === "inclusionConnect"
        ? `${this.inclusionConnectConfig.providerBaseUri}/logout/`
        : `${this.proConnectConfig.providerBaseUri}/session/end`;

    return `${uri}?${queryParamsAsString<OAuthLogoutQueryParams>({
      state: params.state,
      id_token_hint: params.idToken,
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
