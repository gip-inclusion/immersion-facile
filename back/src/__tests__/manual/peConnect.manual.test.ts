/* eslint-disable @typescript-eslint/require-await */
import { AxiosResponse } from "axios";
import secondsToMilliseconds from "date-fns/secondsToMilliseconds";
import { FeatureFlags } from "shared/src/featureFlags";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import supertest, { SuperTest, Test } from "supertest";
// Those are mocked test because real calls to pole emploi api can only be made thought production domain registered with pole emploi
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { createApp } from "../../adapters/primary/server";
import { HttpPeConnectGateway } from "../../adapters/secondary/PeConnectGateway/HttpPeConnectGateway";
import {
  AccessTokenDto,
  ExternalAccessToken,
  toAccessToken,
} from "../../domain/peConnect/dto/AccessToken.dto";
import { ExternalPeConnectOAuthGetTokenWithCodeGrantPayload } from "../../domain/peConnect/dto/PeConnect.dto";
import { externalAccessTokenSchema } from "../../domain/peConnect/port/AccessToken.schema";
import {
  createAxiosInstance,
  PrettyAxiosResponseError,
} from "../../utils/axiosUtils";

const mockedBehavioursWithInvalidSchemaError =
  () => async (): Promise<AccessTokenDto> => {
    const invalidTokenData: ExternalAccessToken = {
      access_token: "A token value",
      expires_in: -1,
    };
    const mockedResponseFromApi: Partial<AxiosResponse<any, any>> = {
      data: invalidTokenData,
      status: 200,
      statusText: "",
    };
    const externalAccessToken: ExternalAccessToken =
      externalAccessTokenSchema.parse(mockedResponseFromApi.data);
    return toAccessToken(externalAccessToken);
  };

const mockedBehavioursWithHttpError =
  () => async (authorization_code: string) => {
    const getAccessTokenPayload: ExternalPeConnectOAuthGetTokenWithCodeGrantPayload =
      {
        grant_type: "authorization_code",
        code: authorization_code,
        client_id: "BLIP",
        client_secret: "BLOP",
        redirect_uri: "https://immersion-facile.beta.gouv.fr/api/pe-connect",
      };

    const response = await createAxiosInstance()
      .post(
        "https://authentification-candidat.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Findividu",
        queryParamsAsString<ExternalPeConnectOAuthGetTokenWithCodeGrantPayload>(
          getAccessTokenPayload,
        ),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: secondsToMilliseconds(10),
        },
      )
      .catch((error) => {
        throw PrettyAxiosResponseError("PeConnect Failure", error);
      });

    const externalAccessToken: ExternalAccessToken =
      externalAccessTokenSchema.parse(response.data);
    return toAccessToken(externalAccessToken);
  };

const prepareAppWithMockedPeConnect = async (
  mockedOAuthAccessToken: (
    authorization_code: string,
  ) => Promise<AccessTokenDto>,
) => {
  const { app, gateways, inMemoryUow } = await createAppWithMockedGateway();

  // eslint-disable-next-line @typescript-eslint/require-await
  inMemoryUow!.getFeatureFlags = async (): Promise<FeatureFlags> =>
    ({ enablePeConnectApi: true } as FeatureFlags);

  gateways.peConnectGateway = {
    ...gateways.peConnectGateway,
    oAuthGetAccessTokenThroughAuthorizationCode: mockedOAuthAccessToken,
  } as unknown as HttpPeConnectGateway;

  return app;
};
const createAppWithMockedGateway = async () => {
  const { app, gateways, inMemoryUow } = await createApp(
    new AppConfigBuilder().build(),
  );
  gateways.peConnectGateway = {
    ...gateways.peConnectGateway,
    oAuthGetAccessTokenThroughAuthorizationCode:
      mockedBehavioursWithHttpError(),
  } as unknown as HttpPeConnectGateway;
  return { app, gateways, inMemoryUow };
};

describe("/pe-connect", () => {
  it("verify that an error in the axios response is handled", async () => {
    const app = await prepareAppWithMockedPeConnect(
      mockedBehavioursWithHttpError(),
    );

    const request: SuperTest<Test> = supertest(app);
    const response = await request.get("/pe-connect?code=12345678");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      errors: {
        _message: "PeConnect Failure",
        body: {
          error: "invalid_client",
          error_description: "Client authentication failed",
        },
        status: "400",
      },
    });
  });

  it("verify that an error in the axios response data (external api contract) is handled", async () => {
    const app = prepareAppWithMockedPeConnect(
      mockedBehavioursWithInvalidSchemaError(),
    );

    const request: SuperTest<Test> = supertest(app);
    const response = await request.get("/pe-connect?code=12345678");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      errors: [
        {
          code: "too_small",
          inclusive: true,
          message: "Ce token est déja expiré",
          minimum: 1,
          path: ["expires_in"],
          type: "number",
        },
      ],
    });
  });
});
