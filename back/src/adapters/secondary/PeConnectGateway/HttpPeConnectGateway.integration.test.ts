import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { createAxiosHandlerCreator } from "http-client";
import {
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  ManagedRedirectError,
  RawRedirectError,
  testManagedRedirectError,
  testRawRedirectError,
} from "shared";
import { AppConfig } from "../../primary/config/appConfig";
import { HttpPeConnectGateway } from "./HttpPeConnectGateway";
import {
  makePeConnectHttpClient,
  peConnectTargets,
  toPeConnectAdvisorDto,
  toPeConnectUserDto,
} from "./peConnectApi.client";
import {
  ExternalPeConnectUser,
  ExternalPeConnectAdvisor,
  ExternalAccessToken,
} from "./peConnectApi.dto";

describe("HttpPeConnectGateway", () => {
  const appConfig = {} as AppConfig;
  const adapter = new HttpPeConnectGateway(
    makePeConnectHttpClient(createAxiosHandlerCreator(axios), appConfig),
    appConfig,
  );
  const mock = new MockAdapter(axios);
  const peExternalUser: ExternalPeConnectUser = {
    email: "maurice.chevalier@gmail.com",
    family_name: "chevalier",
    gender: "male",
    given_name: "maurice",
    idIdentiteExterne: "617cd5a3-2cbd-477c-96a0-85d34381f815",
    sub: "617cd5a3-2cbd-477c-96a0-85d34381f815",
  };
  const peExternalAdvisorCapemploi: ExternalPeConnectAdvisor = {
    type: "CAPEMPLOI",
    civilite: "1",
    mail: "capEmploiAdvisor@pe.fr",
    nom: "prost",
    prenom: "alain",
  };
  const peExternalAdvisorPlacement: ExternalPeConnectAdvisor = {
    type: "PLACEMENT",
    civilite: "1",
    mail: "placementAdvisor@pe.fr",
    nom: "prost",
    prenom: "alain",
  };
  const peConnectUser = (isUserJobseeker: boolean) =>
    toPeConnectUserDto({ ...peExternalUser, isUserJobseeker });
  const peConnectAdvisorPlacement = toPeConnectAdvisorDto(
    peExternalAdvisorPlacement,
  );
  const peConnectAdvisorCapEmploi = toPeConnectAdvisorDto(
    peExternalAdvisorCapemploi,
  );

  const accessToken = {
    expiresIn: 50,
    value: "",
  };

  describe("getAccessToken", () => {
    describe("Right path", () => {
      it(`getAccessToken : OK with ${peExternalUser.email} user and ${peExternalAdvisorPlacement.mail} advisor`, async () => {
        const expectedResponse: ExternalAccessToken = {
          access_token: "5656sdfsdfsdfsdf654",
          expires_in: 50,
        };
        mock
          .onPost(peConnectTargets(appConfig).exchangeCodeForAccessToken.url)
          .reply(200, expectedResponse);
        expectObjectsToMatch(await adapter.getAccessToken(""), {
          expiresIn: expectedResponse.expires_in,
          value: expectedResponse.access_token,
        });
      });
    });
    describe("Wrong path", () => {
      it("Invalid grant -> ManagedRedirectError kind peConnectInvalidGrant", async () => {
        mock
          .onPost(peConnectTargets(appConfig).exchangeCodeForAccessToken.url)
          .reply(400, {
            error_description:
              "The provided access grant is invalid, expired, or revoked.",
            error: "invalid_grant",
          });
        await expectPromiseToFailWithError(
          adapter.getAccessToken(""),
          new ManagedRedirectError("peConnectInvalidGrant", new Error()),
        );
      });
      it("request aborted -> ManagedRedirectError kind peConnectConnectionAborted", async () => {
        mock
          .onPost(peConnectTargets(appConfig).exchangeCodeForAccessToken.url)
          .abortRequest();
        await testManagedRedirectError(
          () => adapter.getAccessToken(""),
          new ManagedRedirectError("peConnectConnectionAborted", new Error()),
        );
      });
    });
  });

  describe("getUserAndAdvisors", () => {
    describe("Right path", () => {
      it(`OK with ${peExternalUser.email} user and ${peExternalAdvisorPlacement.mail} advisor`, async () => {
        mock
          .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
          .reply(200, [peExternalAdvisorPlacement])
          .onGet(peConnectTargets(appConfig).getUserInfo.url)
          .reply(200, peExternalUser)
          .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
          .reply(200, {
            codeStatutIndividu: "1",
            libelleStatutIndividu: "Demandeur d'emploi",
          });
        expectObjectsToMatch(await adapter.getUserAndAdvisors(accessToken), {
          advisors: [peConnectAdvisorPlacement],
          user: peConnectUser(true),
        });
      });
      it(`OK with ${peExternalUser.email} user and ${peExternalAdvisorCapemploi.mail} advisor`, async () => {
        mock
          .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
          .reply(200, [peExternalAdvisorCapemploi])
          .onGet(peConnectTargets(appConfig).getUserInfo.url)
          .reply(200, peExternalUser)
          .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
          .reply(200, {
            codeStatutIndividu: "1",
            libelleStatutIndividu: "Demandeur d'emploi",
          });

        expectObjectsToMatch(await adapter.getUserAndAdvisors(accessToken), {
          advisors: [peConnectAdvisorCapEmploi],
          user: peConnectUser(true),
        });
      });
      it(`OK with user not jobseeker -> no advisors`, async () => {
        mock
          .onGet(peConnectTargets(appConfig).getUserInfo.url)
          .reply(200, peExternalUser)
          .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
          .reply(200, {
            codeStatutIndividu: "0",
            libelleStatutIndividu: "Non demandeur d'emploi",
          });

        expectObjectsToMatch(await adapter.getUserAndAdvisors(accessToken), {
          advisors: [],
          user: peConnectUser(false),
        });
      });
    });
    describe("Wrong path", () => {
      describe("Errors on getUserInfo", () => {
        // eslint-disable-next-line jest/no-disabled-tests
        it.skip(`Timeout on getUserInfo -> Retry`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .timeoutOnce()
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .reply(200, peExternalUser);
          expectObjectsToMatch(await adapter.getUserAndAdvisors(accessToken), {
            advisors: [peConnectAdvisorCapEmploi],
            user: peConnectUser(true),
          });
        });

        // eslint-disable-next-line jest/no-disabled-tests
        it.skip("Should manage Zod Error", () => {
          expect(true).toBe(false);
        });

        it(`Connection aborted -> ManagedRedirectError kind peConnectConnectionAborted`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .abortRequest();
          await expectPromiseToFailWithError(
            adapter.getUserAndAdvisors(accessToken),
            new ManagedRedirectError("peConnectConnectionAborted", new Error()),
          );
        });
        it(`Network error -> RawRedirectError`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .networkError();
          await testRawRedirectError(
            () => adapter.getUserAndAdvisors(accessToken),
            new RawRedirectError(
              "Une erreur est survenue - Erreur réseau",
              "Nous n'avons pas réussi à joindre pôle emploi connect.",
              new Error(),
            ),
          );
        });
        it(`Error 401 -> ManagedRedirectError kind peConnectUserForbiddenAccess`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .reply(401);

          await expectPromiseToFailWithError(
            adapter.getUserAndAdvisors(accessToken),
            new ManagedRedirectError(
              "peConnectUserForbiddenAccess",
              new Error(),
            ),
          );
        });
        it(`Error 500 -> RawRedirectError`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .reply(500);
          await testRawRedirectError(
            () => adapter.getUserAndAdvisors(accessToken),
            new RawRedirectError(
              "Une erreur est survenue - 500",
              "Nous n'avons pas réussi à récupérer vos informations personnelles pôle emploi connect.",
              new Error(),
            ),
          );
        });
      });

      describe("Errors on getAdvisorsInfo", () => {
        // eslint-disable-next-line jest/no-disabled-tests
        it.skip(`Timeout on getUserInfo -> Retry`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .timeoutOnce()
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .reply(200, peExternalUser);
          expectObjectsToMatch(await adapter.getUserAndAdvisors(accessToken), {
            advisors: [peConnectAdvisorCapEmploi],
            user: peConnectUser(true),
          });
        });

        // eslint-disable-next-line jest/no-disabled-tests
        it.skip("Should manage Zod Error", () => {
          expect(true).toBe(false);
        });

        it(`Connection aborted -> ManagedRedirectError kind peConnectConnectionAborted`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .abortRequest()
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d'emploi",
            });
          await testManagedRedirectError(
            () => adapter.getUserAndAdvisors(accessToken),
            new ManagedRedirectError("peConnectConnectionAborted", new Error()),
          );
        });
        it(`Network error -> RawRedirectError`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .networkError()
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d'emploi",
            });
          await testRawRedirectError(
            () => adapter.getUserAndAdvisors(accessToken),
            new RawRedirectError(
              "Une erreur est survenue - Erreur réseau",
              "Nous n'avons pas réussi à joindre pôle emploi connect.",
              new Error(),
            ),
          );
        });
        it(`Error 401 -> ManagedRedirectError kind peConnectAdvisorForbiddenAccess`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .reply(401)
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d'emploi",
            });
          await testManagedRedirectError(
            () => adapter.getUserAndAdvisors(accessToken),
            new ManagedRedirectError(
              "peConnectAdvisorForbiddenAccess",
              new Error(),
            ),
          );
        });
        it(`Error 500 -> OK with no advisors`, async () => {
          mock
            .onGet(peConnectTargets(appConfig).getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d'emploi",
            })
            .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
            .reply(500);
          await expectObjectsToMatch(
            await adapter.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: peConnectUser(true),
            },
          );
        });
      });
    });
  });
});
