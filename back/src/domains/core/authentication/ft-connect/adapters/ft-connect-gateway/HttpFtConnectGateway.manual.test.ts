import MockAdapter from "axios-mock-adapter";
import {
  errors,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  FTConnectError,
  ManagedFTConnectError,
  testManagedFTConnectError,
  testRawFTConnectError,
} from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../../../../../../config/bootstrap/appConfig";
import { makeAxiosInstances } from "../../../../../../utils/axiosUtils";
import type {
  ExternalAccessToken,
  ExternalFtConnectAdvisor,
  ExternalFtConnectUser,
} from "./ftConnectApi.dto";
import {
  makeFtConnectExternalRoutes,
  toFtConnectAdvisorDto,
  toFtConnectUserDto,
} from "./ftConnectApi.routes";
import { HttpFtConnectGateway } from "./HttpFtConnectGateway";

const unhandledStatusCode = 201;

describe("HttpFtConnectGateway", () => {
  const routes = makeFtConnectExternalRoutes({
    ftApiUrl: "https://fake-ft.fr",
    ftAuthCandidatUrl: "https://fake-ft.fr/auth/candidat",
  });

  const config = AppConfig.createFromEnv();
  const { axiosWithoutValidateStatus } = makeAxiosInstances(
    config.externalAxiosTimeout,
  );

  const ftConnectGateway = new HttpFtConnectGateway(
    createAxiosSharedClient(routes, axiosWithoutValidateStatus, {
      skipResponseValidation: true,
    }),
    {
      immersionFacileBaseUrl: "https://fake-immersion.fr",
      franceTravailClientId: "pe-client-id",
      franceTravailClientSecret: "pe-client-secret",
    },
  );

  const mock = new MockAdapter(axiosWithoutValidateStatus);

  const peExternalUser: ExternalFtConnectUser = {
    email: "maurice.chevalier@gmail.com",
    family_name: "chevalier",
    gender: "male",
    given_name: "maurice",
    idIdentiteExterne: "617cd5a3-2cbd-477c-96a0-85d34381f815",
    sub: "617cd5a3-2cbd-477c-96a0-85d34381f815",
  };
  const ftExternalAdvisorCapemploi: ExternalFtConnectAdvisor = {
    type: "CAPEMPLOI",
    civilite: "1",
    mail: "capEmploiAdvisor@pe.fr",
    nom: "prost",
    prenom: "alain",
  };
  const peExternalAdvisorPlacement: ExternalFtConnectAdvisor = {
    type: "PLACEMENT",
    civilite: "1",
    mail: "placementAdvisor@pe.fr",
    nom: "prost",
    prenom: "alain",
  };
  const ftConnectUser = (isUserJobseeker: boolean) =>
    toFtConnectUserDto({ ...peExternalUser, isUserJobseeker });
  const ftConnectAdvisorPlacement = toFtConnectAdvisorDto(
    peExternalAdvisorPlacement,
  );
  const ftConnectAdvisorCapEmploi = toFtConnectAdvisorDto(
    ftExternalAdvisorCapemploi,
  );

  const accessToken = {
    expiresIn: 50,
    value: "my-access-token",
  };

  describe("getAccessToken", () => {
    describe("Right path", () => {
      it(`getAccessToken : OK with ${peExternalUser.email} user and ${peExternalAdvisorPlacement.mail} advisor`, async () => {
        const expectedResponse: ExternalAccessToken = {
          access_token: "5656sdfsdfsdfsdf654",
          expires_in: 50,
        };
        mock
          .onPost(routes.exchangeCodeForAccessToken.url)
          .reply(200, expectedResponse);
        expectObjectsToMatch(await ftConnectGateway.getAccessToken(""), {
          expiresIn: expectedResponse.expires_in,
          value: expectedResponse.access_token,
        });
      });
    });

    describe("Wrong path", () => {
      it("Invalid grant -> ManagedRedirectError kind peConnectInvalidGrant", async () => {
        mock.onPost(routes.exchangeCodeForAccessToken.url).reply(400, {
          error_description:
            "The provided access grant is invalid, expired, or revoked.",
          error: "invalid_grant",
        });
        await expectPromiseToFailWithError(
          ftConnectGateway.getAccessToken(""),
          new ManagedFTConnectError(
            "peConnectInvalidGrant",
            errors.generic.testError("Request failed with status code 400"),
          ),
        );
      });

      it("request aborted -> ManagedRedirectError kind peConnectConnectionAborted", async () => {
        mock.onPost(routes.exchangeCodeForAccessToken.url).abortRequest();
        await testManagedFTConnectError(
          () => ftConnectGateway.getAccessToken(""),
          new ManagedFTConnectError(
            "peConnectConnectionAborted",
            errors.generic.testError(""),
          ),
        );
      });
    });
  });

  describe("getUserAndAdvisors", () => {
    describe("Right path", () => {
      it(`OK with ${peExternalUser.email} user and ${peExternalAdvisorPlacement.mail} advisor`, async () => {
        mock
          .onGet(routes.getAdvisorsInfo.url)
          .reply(200, [peExternalAdvisorPlacement])
          .onGet(routes.getUserInfo.url)
          .reply(200, peExternalUser)
          .onGet(routes.getUserStatutInfo.url)
          .reply(200, {
            codeStatutIndividu: "1",
            libelleStatutIndividu: "Demandeur d’emploi",
          });

        expectObjectsToMatch(
          await ftConnectGateway.getUserAndAdvisors(accessToken),
          {
            advisors: [ftConnectAdvisorPlacement],
            user: ftConnectUser(true),
          },
        );
      });

      it(`OK with ${peExternalUser.email} user and ${ftExternalAdvisorCapemploi.mail} advisor`, async () => {
        mock
          .onGet(routes.getAdvisorsInfo.url)
          .reply(200, [ftExternalAdvisorCapemploi])
          .onGet(routes.getUserInfo.url)
          .reply(200, peExternalUser)
          .onGet(routes.getUserStatutInfo.url)
          .reply(200, {
            codeStatutIndividu: "1",
            libelleStatutIndividu: "Demandeur d’emploi",
          });

        expectObjectsToMatch(
          await ftConnectGateway.getUserAndAdvisors(accessToken),
          {
            advisors: [ftConnectAdvisorCapEmploi],
            user: ftConnectUser(true),
          },
        );
      });

      it("OK with user not jobseeker -> no advisors", async () => {
        mock
          .onGet(routes.getUserInfo.url)
          .reply(200, peExternalUser)
          .onGet(routes.getUserStatutInfo.url)
          .reply(200, {
            codeStatutIndividu: "0",
            libelleStatutIndividu: "Non demandeur d’emploi",
          });

        expectObjectsToMatch(
          await ftConnectGateway.getUserAndAdvisors(accessToken),
          {
            advisors: [],
            user: ftConnectUser(false),
          },
        );
      });
    });

    describe("Wrong path", () => {
      describe("Errors on getUserInfo", () => {
        // it(`Timeout on getUserInfo -> Retry`, async () => {
        //   mock
        //     .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
        //     .reply(200, [ftExternalAdvisorCapemploi])
        //     .onGet(peConnectTargets(appConfig).getUserInfo.url)
        //     .timeout()
        //     /*            .onGet(peConnectTargets(appConfig).getUserInfo.url)
        //     .reply(200, peExternalUser)*/
        //     .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
        //     .reply(200, {
        //       codeStatutIndividu: "1",
        //       libelleStatutIndividu: "Demandeur d’emploi",
        //     });
        //   expectObjectsToMatch(await ftConnectGateway.getUserAndAdvisors(accessToken), {
        //     advisors: [ftConnectAdvisorCapEmploi],
        //     user: ftConnectUser(true),
        //   });
        // });

        it("Zod Error -> OK with undefined", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .reply(200, "UNSUPPORTED RESPONSE")
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          expect(
            await ftConnectGateway.getUserAndAdvisors(accessToken),
          ).toBeUndefined();
        });

        it("Bad status code -> OK with undefined", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [ftExternalAdvisorCapemploi])
            .onGet(routes.getUserInfo.url)
            .reply(unhandledStatusCode, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          expect(
            await ftConnectGateway.getUserAndAdvisors(accessToken),
          ).toBeUndefined();
        });

        it("Connection aborted -> ManagedRedirectError kind peConnectConnectionAborted", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .abortRequest();
          await expectPromiseToFailWithError(
            ftConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedFTConnectError(
              "peConnectConnectionAborted",
              errors.generic.testError("Request aborted"),
            ),
          );
        });

        it("Network error -> RawRedirectError", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .networkError();
          await testRawFTConnectError(
            () => ftConnectGateway.getUserAndAdvisors(accessToken),
            new FTConnectError(
              "Une erreur est survenue - Erreur réseau",
              "Nous n’avons pas réussi à joindre pôle emploi connect.",
              new Error(),
            ),
          );
        });

        it("Error 401 -> ManagedRedirectError kind peConnectUserForbiddenAccess", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .reply(401);
          await expectPromiseToFailWithError(
            ftConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedFTConnectError(
              "peConnectGetUserInfoForbiddenAccess",
              new Error("Request failed with status code 401"),
            ),
          );
        });

        it("Error 500 -> RawRedirectError", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .reply(500);
          await testRawFTConnectError(
            () => ftConnectGateway.getUserAndAdvisors(accessToken),
            new FTConnectError(
              "Une erreur est survenue - 500",
              "Nous n’avons pas réussi à récupérer vos informations personnelles pôle emploi connect.",
              new Error(),
            ),
          );
        });
      });

      describe("Errors on getAdvisorsInfo", () => {
        // it(`Timeout on getAdvisorsInfo -> Retry`, async () => {
        //   mock
        //     .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
        //     .timeout()
        //     /*            .onGet(peConnectTargets(appConfig).getUserInfo.url)
        //     .reply(200, peExternalUser)*/
        //     .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
        //     .reply(200, [ftExternalAdvisorCapemploi])
        //     .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
        //     .reply(200, {
        //       codeStatutIndividu: "1",
        //       libelleStatutIndividu: "Demandeur d’emploi",
        //     });
        //   expectObjectsToMatch(await ftConnectGateway.getUserAndAdvisors(accessToken), {
        //     advisors: [ftConnectAdvisorCapEmploi],
        //     user: ftConnectUser(true),
        //   });
        // });

        it("Zod Error -> OK with No advisors", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, "UNSUPPORTED RESPONSE")
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          expectObjectsToMatch(
            await ftConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: ftConnectUser(true),
            },
          );
        });

        it("Bad status code -> OK with No advisors", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(unhandledStatusCode, [ftExternalAdvisorCapemploi])
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          expectObjectsToMatch(
            await ftConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: ftConnectUser(true),
            },
          );
        });

        it("Connection aborted -> ManagedRedirectError kind peConnectConnectionAborted", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .abortRequest()
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          await testManagedFTConnectError(
            () => ftConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedFTConnectError(
              "peConnectConnectionAborted",
              new Error(),
            ),
          );
        });

        it("Network error -> RawRedirectError", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .networkError()
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          await testRawFTConnectError(
            () => ftConnectGateway.getUserAndAdvisors(accessToken),
            new FTConnectError(
              "Une erreur est survenue - Erreur réseau",
              "Nous n’avons pas réussi à joindre pôle emploi connect.",
              new Error(),
            ),
          );
        });

        it("Error 401 -> ManagedRedirectError kind peConnectAdvisorForbiddenAccess", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(401)
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          await testManagedFTConnectError(
            () => ftConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedFTConnectError(
              "peConnectAdvisorForbiddenAccess",
              new Error(),
            ),
          );
        });

        it("Error 500 -> OK with no advisors", async () => {
          mock
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            })
            .onGet(routes.getAdvisorsInfo.url)
            .reply(500);
          await expectObjectsToMatch(
            await ftConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: ftConnectUser(true),
            },
          );
        });
      });

      describe("Errors on getUserStatutInfo", () => {
        it("Zod Error getUserStatutInfo -> OK with No advisors and not jobseeker", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, "UNSUPPORTED RESPONSE");
          expectObjectsToMatch(
            await ftConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: ftConnectUser(false),
            },
          );
        });

        it("Bad status code -> OK with No advisors and not jobseeker", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [ftExternalAdvisorCapemploi])
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(unhandledStatusCode, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          expectObjectsToMatch(
            await ftConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: ftConnectUser(false),
            },
          );
        });

        it("Connection aborted -> ManagedRedirectError kind peConnectConnectionAborted", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .abortRequest();
          await expectPromiseToFailWithError(
            ftConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedFTConnectError(
              "peConnectConnectionAborted",
              new Error("Request aborted"),
            ),
          );
        });

        it("Network error -> RawRedirectError", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .networkError();
          await testRawFTConnectError(
            () => ftConnectGateway.getUserAndAdvisors(accessToken),
            new FTConnectError(
              "Une erreur est survenue - Erreur réseau",
              "Nous n’avons pas réussi à joindre pôle emploi connect.",
              new Error(),
            ),
          );
        });

        it("Error 401 -> ManagedRedirectError kind peConnectUserForbiddenAccess", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(401);
          await expectPromiseToFailWithError(
            ftConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedFTConnectError(
              "peConnectGetUserStatusInfoForbiddenAccess",
              new Error("Request failed with status code 401"),
            ),
          );
        });

        it("Error 500 -> RawRedirectError", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(500);
          await testRawFTConnectError(
            () => ftConnectGateway.getUserAndAdvisors(accessToken),
            new FTConnectError(
              "Une erreur est survenue - 500",
              "Nous n’avons pas réussi à récupérer votre status pôle emploi connect.",
              new Error(),
            ),
          );
        });
      });
    });
  });
});
