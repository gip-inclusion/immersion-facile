import { ConnectionRefusedError } from "shared/src/httpClient/errors/ConnectionRefused.error";
import {
  createManagedAxiosInstance,
  ErrorMapper,
  TargetMapper,
} from "../shared/src/httpClient/ports/axios.adapter";

import {
  HttpPeConnectGateway,
  HttpPeConnectGatewayConfig,
} from "../../adapters/secondary/HttpPeConnectGateway";

import { expectPromiseToFailWithError } from "../../_testBuilders/test.helpers";

describe("HttpPeConnectGateway", () => {
  it("should have a connexion error if the httpClient could not connect", async () => {
    const testGateway = new HttpPeConnectGateway(
      {} as unknown as HttpPeConnectGatewayConfig,
      createManagedAxiosInstance(
        {} as TargetMapper<"plop">,
        {} as ErrorMapper<"plop">,
      ),
    );

    await expectPromiseToFailWithError(
      testGateway.peAccessTokenThroughAuthorizationCode("fakeCode"),
      new ConnectionRefusedError(
        `Could not connect to server : ${JSON.stringify(
          {
            code: "ECONNREFUSED",
            address: "127.0.0.1",
            port: 80,
            config: {
              headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "axios/0.26.1",
                "Content-Length": 81,
              },
              method: "post",
              data: "grant_type=authorization_code&code=fakeCode&redirect_uri=undefined/api/pe-connect",
            },
          },
          null,
          2,
        )}`,
      ),
    );
  });

  it.skip("url in response config shoud match full url | baseUrl should contain target", async () => {
    const testGateway = new HttpPeConnectGateway(
      {} as unknown as HttpPeConnectGatewayConfig,
      createManagedAxiosInstance(
        {
          OAUTH2_ACCESS_TOKEN_STEP_2: `https://undefined/connexion/oauth2/access_token?realm=%2Findividu`,
        },
        {
          OAUTH2_ACCESS_TOKEN_STEP_2: {
            401: () => new Error(`J'aime le paté`),
          },
        },
      ),
    );

    await expectPromiseToFailWithError(
      testGateway.peAccessTokenThroughAuthorizationCode("fakeCode"),
      new ConnectionRefusedError(
        `Could not connect to server : ${JSON.stringify(
          {
            code: "ECONNREFUSED",
            address: "127.0.0.1",
            port: 80,
            config: {
              headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "axios/0.26.1",
                "Content-Length": 81,
              },
              method: "post",
              baseUrl: `OAUTH2_ACCESS_TOKEN_STEP_2`,
              url: "https://undefined/connexion/oauth2/access_token?realm=%2Findividu",
              data: "grant_type=authorization_code&code=fakeCode&redirect_uri=undefined/api/pe-connect",
            },
          },
          null,
          2,
        )}`,
      ),
    );
  });
});
