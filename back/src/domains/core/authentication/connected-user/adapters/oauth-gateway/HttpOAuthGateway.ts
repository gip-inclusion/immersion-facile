import {
  type AbsoluteUrl,
  decodeJwtWithoutSignatureCheck,
  errors,
  queryParamsAsString,
} from "shared";
import type { HttpClient } from "shared-routes";
import type { OAuthConfig } from "../../../../../../config/bootstrap/appConfig";
import { validateAndParseZodSchema } from "../../../../../../config/helpers/validateAndParseZodSchema";
import { createLogger } from "../../../../../../utils/logger";
import {
  type ProConnectOAuthIdTokenPayload,
  proConnectAuthTokenPayloadSchema,
} from "../../entities/OAuthIdTokenPayload";
import type {
  GetAccessTokenParams,
  GetAccessTokenResult,
  GetLoginUrlParams,
  GetLogoutUrlParams,
  OAuthGateway,
} from "../../port/OAuthGateway";
import type { ProConnectRoutes } from "./proConnect.routes";

type OAuthLogoutQueryParams = {
  post_logout_redirect_uri: AbsoluteUrl;
  id_token_hint: string;
  state: string;
};

const logger = createLogger(__filename);

export class HttpOAuthGateway implements OAuthGateway {
  #httpClient: HttpClient<ProConnectRoutes>;
  #proConnectConfig: OAuthConfig;

  constructor(
    httpClient: HttpClient<ProConnectRoutes>,
    proConnectConfig: OAuthConfig,
  ) {
    this.#httpClient = httpClient;
    this.#proConnectConfig = proConnectConfig;
  }

  public async getLoginUrl({
    nonce,
    state,
  }: GetLoginUrlParams): Promise<AbsoluteUrl> {
    const baseParams: Omit<
      BaseProConnectLoginUrlParams,
      "client_id" | "scope"
    > = {
      state,
      nonce,
      redirect_uri: this.#proConnectConfig.immersionRedirectUri.afterLogin,
      response_type: "code",
    };
    const queryParams = queryParamsAsString<ProConnectLoginUrlParams>({
      ...baseParams,
      acr_values: "eidas1",
      client_id: this.#proConnectConfig.clientId,
      scope: this.#proConnectConfig.scope,
    });

    return `${this.#proConnectConfig.providerBaseUri}/authorize?${queryParams}`;
  }

  async getAccessToken({
    code,
  }: GetAccessTokenParams): Promise<GetAccessTokenResult> {
    const queryParams = {
      body: queryParamsAsString({
        code,
        client_id: this.#proConnectConfig.clientId,
        client_secret: this.#proConnectConfig.clientSecret,
        grant_type: "authorization_code",
        redirect_uri: this.#proConnectConfig.immersionRedirectUri.afterLogin,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded" as const,
      },
    };

    const { body: proConnectAccessTokenBody } =
      await this.#httpClient.getAccessToken(queryParams);

    const { nonce } = decodeJwtWithoutSignatureCheck<{ nonce: string }>(
      proConnectAccessTokenBody.id_token,
    );

    const response = await this.#httpClient.getUserInfo({
      headers: {
        authorization: `Bearer ${proConnectAccessTokenBody.access_token}`,
      },
    });

    if (response.status === 400)
      throw errors.proConnect.couldNotGetUserInfo({
        message: JSON.stringify(response.body, null, 2),
      });

    const tokenWithPayload = response.body;

    const tokenPayload =
      decodeJwtWithoutSignatureCheck<ProConnectOAuthIdTokenPayload>(
        tokenWithPayload,
      );

    const oAuthIdTokenPayload = validateAndParseZodSchema({
      schemaName: "proConnectAuthTokenPayloadSchema",
      inputSchema: proConnectAuthTokenPayloadSchema,
      schemaParsingInput: tokenPayload,
      logger,
    });

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
        structure_pe: oAuthIdTokenPayload.custom.structureTravail,
        siret: oAuthIdTokenPayload.siret,
      },
    };
  }

  public async getLogoutUrl(params: GetLogoutUrlParams): Promise<AbsoluteUrl> {
    const uri: AbsoluteUrl = `${this.#proConnectConfig.providerBaseUri}/session/end`;
    const postLogoutRedirectUri =
      this.#proConnectConfig.immersionRedirectUri.afterLogout;

    return `${uri}?${queryParamsAsString<OAuthLogoutQueryParams>({
      state: params.state,
      id_token_hint: params.idToken,
      post_logout_redirect_uri: postLogoutRedirectUri,
    })}`;
  }
}

type BaseProConnectLoginUrlParams = {
  response_type: "code";
  client_id: string;
  redirect_uri: AbsoluteUrl;
  scope: string;
  state: string;
  nonce: string;
  login_hint?: string;
};

type ProConnectLoginUrlParams = BaseProConnectLoginUrlParams & {
  acr_values: string;
};
