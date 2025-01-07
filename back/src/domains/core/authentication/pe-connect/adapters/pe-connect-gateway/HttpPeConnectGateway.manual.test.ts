import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import {
  ManagedRedirectError,
  RawRedirectError,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  testManagedRedirectError,
  testRawRedirectError,
} from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { HttpPeConnectGateway } from "./HttpPeConnectGateway";
import {
  ExternalAccessToken,
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
} from "./peConnectApi.dto";
import {
  makePeConnectExternalRoutes,
  toPeConnectAdvisorDto,
  toPeConnectUserDto,
} from "./peConnectApi.routes";

const unhandledStatusCode = 201;

describe("HttpPeConnectGateway", () => {
  const routes = makePeConnectExternalRoutes({
    peApiUrl: "https://fake-pe.fr",
    peAuthCandidatUrl: "https://fake-pe.fr/auth/candidat",
  });

  const httpClient = createAxiosSharedClient(routes, axios, {
    skipResponseValidation: true,
  });

  const peConnectGateway = new HttpPeConnectGateway(httpClient, {
    immersionFacileBaseUrl: "https://fake-immersion.fr",
    poleEmploiClientId: "pe-client-id",
    poleEmploiClientSecret: "pe-client-secret",
  });

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
        expectObjectsToMatch(await peConnectGateway.getAccessToken(""), {
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
          peConnectGateway.getAccessToken(""),
          new ManagedRedirectError(
            "peConnectInvalidGrant",
            new Error("Request failed with status code 400"),
          ),
        );
      });

      it("request aborted -> ManagedRedirectError kind peConnectConnectionAborted", async () => {
        mock.onPost(routes.exchangeCodeForAccessToken.url).abortRequest();
        await testManagedRedirectError(
          () => peConnectGateway.getAccessToken(""),
          new ManagedRedirectError("peConnectConnectionAborted", new Error()),
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
          await peConnectGateway.getUserAndAdvisors(accessToken),
          {
            advisors: [peConnectAdvisorPlacement],
            user: peConnectUser(true),
          },
        );
      });

      it(`OK with ${peExternalUser.email} user and ${peExternalAdvisorCapemploi.mail} advisor`, async () => {
        mock
          .onGet(routes.getAdvisorsInfo.url)
          .reply(200, [peExternalAdvisorCapemploi])
          .onGet(routes.getUserInfo.url)
          .reply(200, peExternalUser)
          .onGet(routes.getUserStatutInfo.url)
          .reply(200, {
            codeStatutIndividu: "1",
            libelleStatutIndividu: "Demandeur d’emploi",
          });

        expectObjectsToMatch(
          await peConnectGateway.getUserAndAdvisors(accessToken),
          {
            advisors: [peConnectAdvisorCapEmploi],
            user: peConnectUser(true),
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
          await peConnectGateway.getUserAndAdvisors(accessToken),
          {
            advisors: [],
            user: peConnectUser(false),
          },
        );
      });
    });

    describe("Wrong path", () => {
      describe("Errors on getUserInfo", () => {
        // it(`Timeout on getUserInfo -> Retry`, async () => {
        //   mock
        //     .onGet(peConnectTargets(appConfig).getAdvisorsInfo.url)
        //     .reply(200, [peExternalAdvisorCapemploi])
        //     .onGet(peConnectTargets(appConfig).getUserInfo.url)
        //     .timeout()
        //     /*            .onGet(peConnectTargets(appConfig).getUserInfo.url)
        //     .reply(200, peExternalUser)*/
        //     .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
        //     .reply(200, {
        //       codeStatutIndividu: "1",
        //       libelleStatutIndividu: "Demandeur d’emploi",
        //     });
        //   expectObjectsToMatch(await peConnectGateway.getUserAndAdvisors(accessToken), {
        //     advisors: [peConnectAdvisorCapEmploi],
        //     user: peConnectUser(true),
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
            await peConnectGateway.getUserAndAdvisors(accessToken),
          ).toBeUndefined();
        });

        it("Bad status code -> OK with undefined", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorCapemploi])
            .onGet(routes.getUserInfo.url)
            .reply(unhandledStatusCode, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          expect(
            await peConnectGateway.getUserAndAdvisors(accessToken),
          ).toBeUndefined();
        });

        it("Connection aborted -> ManagedRedirectError kind peConnectConnectionAborted", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorPlacement])
            .onGet(routes.getUserInfo.url)
            .abortRequest();
          await expectPromiseToFailWithError(
            peConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedRedirectError(
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
            .networkError();
          await testRawRedirectError(
            () => peConnectGateway.getUserAndAdvisors(accessToken),
            new RawRedirectError(
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
            peConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedRedirectError(
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
          await testRawRedirectError(
            () => peConnectGateway.getUserAndAdvisors(accessToken),
            new RawRedirectError(
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
        //     .reply(200, [peExternalAdvisorCapemploi])
        //     .onGet(peConnectTargets(appConfig).getUserStatutInfo.url)
        //     .reply(200, {
        //       codeStatutIndividu: "1",
        //       libelleStatutIndividu: "Demandeur d’emploi",
        //     });
        //   expectObjectsToMatch(await peConnectGateway.getUserAndAdvisors(accessToken), {
        //     advisors: [peConnectAdvisorCapEmploi],
        //     user: peConnectUser(true),
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
            await peConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: peConnectUser(true),
            },
          );
        });

        it("Bad status code -> OK with No advisors", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(unhandledStatusCode, [peExternalAdvisorCapemploi])
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(200, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          expectObjectsToMatch(
            await peConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: peConnectUser(true),
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
          await testManagedRedirectError(
            () => peConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedRedirectError("peConnectConnectionAborted", new Error()),
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
          await testRawRedirectError(
            () => peConnectGateway.getUserAndAdvisors(accessToken),
            new RawRedirectError(
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
          await testManagedRedirectError(
            () => peConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedRedirectError(
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
            await peConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: peConnectUser(true),
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
            await peConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: peConnectUser(false),
            },
          );
        });

        it("Bad status code -> OK with No advisors and not jobseeker", async () => {
          mock
            .onGet(routes.getAdvisorsInfo.url)
            .reply(200, [peExternalAdvisorCapemploi])
            .onGet(routes.getUserInfo.url)
            .reply(200, peExternalUser)
            .onGet(routes.getUserStatutInfo.url)
            .reply(unhandledStatusCode, {
              codeStatutIndividu: "1",
              libelleStatutIndividu: "Demandeur d’emploi",
            });
          expectObjectsToMatch(
            await peConnectGateway.getUserAndAdvisors(accessToken),
            {
              advisors: [],
              user: peConnectUser(false),
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
            peConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedRedirectError(
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
          await testRawRedirectError(
            () => peConnectGateway.getUserAndAdvisors(accessToken),
            new RawRedirectError(
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
            peConnectGateway.getUserAndAdvisors(accessToken),
            new ManagedRedirectError(
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
          await testRawRedirectError(
            () => peConnectGateway.getUserAndAdvisors(accessToken),
            new RawRedirectError(
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
