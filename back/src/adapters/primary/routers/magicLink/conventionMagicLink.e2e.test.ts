import { addDays } from "date-fns";
import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  type ConnectedUserJwtPayload,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionMagicLinkRoutes,
  type ConventionRole,
  conventionMagicLinkRoutes,
  currentJwtVersions,
  defaultProConnectInfos,
  errors,
  expectHttpResponseToEqual,
  expectObjectsToMatch,
  expectToEqual,
  type RenewConventionParams,
  ScheduleDtoBuilder,
  type User,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import type {
  GenerateConnectedUserJwt,
  GenerateConventionJwt,
} from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  buildTestApp,
  type InMemoryGateways,
} from "../../../../utils/buildTestApp";
import { makeHashByRolesForTest } from "../../../../utils/emailHash";

describe("Magic link router", () => {
  const payloadMeta = {
    exp: Date.now() / 1000 + 1000,
    iat: Date.now() / 1000,
    version: 1,
  };

  const conventionBuilder = new ConventionDtoBuilder().withStatus(
    "READY_TO_SIGN",
  );

  const backofficeAdminUserBuilder = new ConnectedUserBuilder()
    .withId("backoffice-admin-user")
    .withIsAdmin(true);
  const connectedBackofficeAdminUser = backofficeAdminUserBuilder.build();
  const backofficeAdminUser = backofficeAdminUserBuilder.build();

  const backofficeAdminJwtPayload: ConnectedUserJwtPayload = {
    version: currentJwtVersions.connectedUser,
    iat: Date.now(),
    exp: addDays(new Date(), 30).getTime(),
    userId: connectedBackofficeAdminUser.id,
  };

  let request: SuperTest<Test>;
  let generateConventionJwt: GenerateConventionJwt;
  let generateConnectedUserJwt: GenerateConnectedUserJwt;
  let inMemoryUow: InMemoryUnitOfWork;
  let httpClient: HttpClient<ConventionMagicLinkRoutes>;
  let gateways: InMemoryGateways;

  beforeEach(async () => {
    ({
      request,
      generateConventionJwt,
      generateConnectedUserJwt,
      inMemoryUow,
      gateways,
    } = await buildTestApp());
    httpClient = createSupertestSharedClient(
      conventionMagicLinkRoutes,
      request,
    );
    const initialConvention = conventionBuilder.build();
    inMemoryUow.conventionRepository.setConventions([initialConvention]);
    inMemoryUow.userRepository.users = [backofficeAdminUser];
  });

  describe("POST /auth/demande-immersion/:conventionId", () => {
    describe("when beneficiary modification", () => {
      it("can update the convention", async () => {
        const updatedConvention = conventionBuilder
          .withStatus("READY_TO_SIGN")
          .withActivities("Plein d'activitées cool !")
          .build();

        inMemoryUow.conventionRepository.setConventions([
          {
            ...updatedConvention,
            immersionActivities: "pas grand chose",
            status: "READY_TO_SIGN",
          },
        ]);
        inMemoryUow.agencyRepository.agencies = [
          toAgencyWithRights(
            AgencyDtoBuilder.create(updatedConvention.agencyId)
              .withName("TEST-name")
              .withSignature("TEST-signature")
              .build(),
          ),
        ];

        const counsellor = new ConnectedUserBuilder()
          .withId("dummy-counsellor")
          .withEmail("counsellor@test.com")
          .buildUser();
        const validator = new ConnectedUserBuilder()
          .withId("dummy-validator")
          .withEmail("validator@test.com")
          .buildUser();

        const emailHash = makeHashByRolesForTest(
          updatedConvention,
          counsellor,
          validator,
        ).beneficiary;

        const backOfficeJwt = generateConventionJwt({
          ...payloadMeta,
          role: "beneficiary",
          emailHash: emailHash,
          applicationId: updatedConvention.id,
        });

        const response = await httpClient.updateConvention({
          urlParams: { conventionId: updatedConvention.id },
          body: { convention: updatedConvention },
          headers: { authorization: backOfficeJwt },
        });

        expectHttpResponseToEqual(response, {
          status: 200,
          body: { id: updatedConvention.id },
        });
      });
    });

    describe("User is not allowed", () => {
      it("throws when user is not admin and have no rights on the agency", async () => {
        const updatedConvention = conventionBuilder
          .withBeneficiaryFirstName("Merguez")
          .withStatus("READY_TO_SIGN")
          .withStatusJustification("Justif")
          .build();

        inMemoryUow.agencyRepository.agencies = [
          toAgencyWithRights(
            AgencyDtoBuilder.create(updatedConvention.agencyId).build(),
          ),
        ];

        const notAdminUser = new ConnectedUserBuilder()
          .withIsAdmin(false)
          .buildUser();

        inMemoryUow.userRepository.users = [notAdminUser];

        const response = await httpClient.updateConvention({
          urlParams: { conventionId: updatedConvention.id },
          body: { convention: updatedConvention },
          headers: {
            authorization: generateConnectedUserJwt({
              userId: notAdminUser.id,
              version: currentJwtVersions.connectedUser,
            }),
          },
        });

        expectHttpResponseToEqual(response, {
          status: 403,
          body: {
            status: 403,
            message: errors.convention.updateForbidden({
              id: updatedConvention.id,
            }).message,
          },
        });
      });
    });

    describe("when admin sends modification requests", () => {
      it("works fine", async () => {
        const updatedConvention = conventionBuilder
          .withBeneficiaryFirstName("Merguez")
          .withStatus("READY_TO_SIGN")
          .withStatusJustification("Justif")
          .notSigned()
          .build();

        inMemoryUow.agencyRepository.agencies = [
          toAgencyWithRights(
            AgencyDtoBuilder.create(updatedConvention.agencyId).build(),
          ),
        ];

        const backOfficeJwt = generateConnectedUserJwt(
          backofficeAdminJwtPayload,
        );

        const response = await httpClient.updateConvention({
          urlParams: { conventionId: updatedConvention.id },
          body: { convention: updatedConvention },
          headers: { authorization: backOfficeJwt },
        });

        expectHttpResponseToEqual(response, {
          status: 200,
          body: { id: updatedConvention.id },
        });
        expectToEqual(inMemoryUow.conventionRepository.conventions, [
          updatedConvention,
        ]);
      });
    });
  });

  describe("POST /renew-convention", () => {
    const existingConvention = new ConventionDtoBuilder().build();
    const renewedConventionStartDate = addDays(
      new Date(existingConvention.dateEnd),
      1,
    );
    const renewedConventionEndDate = addDays(renewedConventionStartDate, 5);
    const renewedConventionParams: RenewConventionParams = {
      id: "11111111-1111-4111-9111-111111111111",
      dateStart: renewedConventionStartDate.toISOString(),
      dateEnd: renewedConventionEndDate.toISOString(),
      schedule: new ScheduleDtoBuilder()
        .withDateInterval({
          start: renewedConventionStartDate,
          end: renewedConventionEndDate,
        })
        .withRegularSchedule({
          selectedDays: [0, 4],
          timePeriods: [
            { start: "09:00", end: "12:00" },
            { start: "13:00", end: "17:00" },
          ],
        })
        .build(),
      renewed: {
        from: existingConvention.id,
        justification: "Il faut bien...",
      },
    };

    const createTokenForRole = ({
      role,
      conventionId,
    }: {
      role: ConventionRole;
      conventionId: ConventionId;
    }) =>
      generateConventionJwt({
        applicationId: conventionId,
        role,
        version: 1,
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 1000,
        emailHash: "my-hash",
      });

    it("200 - Creates a convention with provided data and convention jwt", async () => {
      const existingConvention = new ConventionDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();
      inMemoryUow.conventionRepository.setConventions([existingConvention]);
      const renewedConventionStartDate = addDays(
        new Date(existingConvention.dateEnd),
        1,
      );
      const renewedConventionEndDate = addDays(renewedConventionStartDate, 5);
      const renewedConventionParams: RenewConventionParams = {
        id: "22222222-2222-4222-9222-222222222222",
        dateStart: renewedConventionStartDate.toISOString(),
        dateEnd: renewedConventionEndDate.toISOString(),
        schedule: new ScheduleDtoBuilder()
          .withReasonableScheduleInInterval({
            start: renewedConventionStartDate,
            end: renewedConventionEndDate,
          })
          .build(),
        renewed: {
          from: existingConvention.id,
          justification: "Il faut bien...",
        },
      };
      const response = await request
        .post(conventionMagicLinkRoutes.renewConvention.url)
        .send(renewedConventionParams)
        .set({
          authorization: generateConventionJwt({
            applicationId: existingConvention.id,
            role: "validator",
            version: 1,
            iat: Date.now() / 1000,
            exp: Date.now() / 1000 + 1000,
            emailHash: "my-hash",
          }),
        });

      expectToEqual(response.body, "");
      expectToEqual(response.status, 200);
      expectToEqual(inMemoryUow.conventionRepository.conventions, [
        existingConvention,
        {
          ...existingConvention,
          ...renewedConventionParams,
          signatories: {
            beneficiary: {
              ...existingConvention.signatories.beneficiary,
              signedAt: undefined,
            },
            establishmentRepresentative: {
              ...existingConvention.signatories.establishmentRepresentative,
              signedAt: undefined,
            },
          },
          status: "READY_TO_SIGN",
        },
      ]);
    });

    it("200 - Creates a convention with provided data and backoffice jwt", async () => {
      const existingConvention = new ConventionDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();
      inMemoryUow.conventionRepository.setConventions([existingConvention]);
      const renewedConventionStartDate = addDays(
        new Date(existingConvention.dateEnd),
        1,
      );
      const renewedConventionEndDate = addDays(renewedConventionStartDate, 5);
      const renewedConventionParams: RenewConventionParams = {
        id: "22222222-2222-4222-9222-222222222222",
        dateStart: renewedConventionStartDate.toISOString(),
        dateEnd: renewedConventionEndDate.toISOString(),
        schedule: new ScheduleDtoBuilder()
          .withReasonableScheduleInInterval({
            start: renewedConventionStartDate,
            end: renewedConventionEndDate,
          })
          .build(),
        renewed: {
          from: existingConvention.id,
          justification: "Il faut bien...",
        },
      };
      const response = await request
        .post(conventionMagicLinkRoutes.renewConvention.url)
        .send(renewedConventionParams)
        .set({
          authorization: generateConnectedUserJwt(backofficeAdminJwtPayload),
        });

      expectToEqual(response.body, "");
      expectToEqual(response.status, 200);
      expectToEqual(inMemoryUow.conventionRepository.conventions, [
        existingConvention,
        {
          ...existingConvention,
          ...renewedConventionParams,
          signatories: {
            beneficiary: {
              ...existingConvention.signatories.beneficiary,
              signedAt: undefined,
            },
            establishmentRepresentative: {
              ...existingConvention.signatories.establishmentRepresentative,
              signedAt: undefined,
            },
          },
          status: "READY_TO_SIGN",
        },
      ]);
    });

    it("200 - Creates a convention with provided data and connected user JWT", async () => {
      const agency = new AgencyDtoBuilder().build();
      const existingConvention = new ConventionDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withAgencyId(agency.id)
        .build();
      inMemoryUow.conventionRepository.setConventions([existingConvention]);

      const validator: User = {
        id: "my-user-id",
        email: "my-user@email.com",
        firstName: "John",
        lastName: "Doe",
        proConnect: defaultProConnectInfos,
        createdAt: new Date().toISOString(),
      };

      inMemoryUow.userRepository.users = [validator];
      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
        }),
      ];

      const renewedConventionStartDate = addDays(
        new Date(existingConvention.dateEnd),
        1,
      );
      const renewedConventionEndDate = addDays(renewedConventionStartDate, 5);
      const renewedConventionParams: RenewConventionParams = {
        id: "22222222-2222-4222-9222-222222222222",
        dateStart: renewedConventionStartDate.toISOString(),
        dateEnd: renewedConventionEndDate.toISOString(),
        schedule: new ScheduleDtoBuilder()
          .withReasonableScheduleInInterval({
            start: renewedConventionStartDate,
            end: renewedConventionEndDate,
          })
          .build(),
        renewed: {
          from: existingConvention.id,
          justification: "Il faut bien...",
        },
      };
      const response = await request
        .post(conventionMagicLinkRoutes.renewConvention.url)
        .send(renewedConventionParams)
        .set({
          authorization: generateConnectedUserJwt({
            userId: validator.id,
            version: 1,
            iat: Date.now() / 1000,
            exp: Date.now() / 1000 + 1000,
          }),
        });

      expectToEqual(response.body, "");
      expectToEqual(response.status, 200);
      expectToEqual(inMemoryUow.conventionRepository.conventions, [
        existingConvention,
        {
          ...existingConvention,
          ...renewedConventionParams,
          signatories: {
            beneficiary: {
              ...existingConvention.signatories.beneficiary,
              signedAt: undefined,
            },
            establishmentRepresentative: {
              ...existingConvention.signatories.establishmentRepresentative,
              signedAt: undefined,
            },
          },
          status: "READY_TO_SIGN",
        },
      ]);
    });

    it("400 - Fails if no convention magic link token is provided", async () => {
      const response = await request
        .post(conventionMagicLinkRoutes.renewConvention.url)
        .send(renewedConventionParams);

      expectToEqual(response.body, {
        issues: [
          "authorization : Invalid input: expected string, received undefined",
        ],
        message:
          "Shared-route schema 'headersSchema' was not respected in adapter 'express'.\nRoute: POST /auth/renew-convention",
        status: 400,
      });
      expectToEqual(response.status, 400);
    });

    it("400 - Fails if original convention is not ACCEPTED_BY_VALIDATOR", async () => {
      const response = await request
        .post(conventionMagicLinkRoutes.renewConvention.url)
        .send(renewedConventionParams)
        .set({
          authorization: createTokenForRole({
            role: "counsellor",
            conventionId: existingConvention.id,
          }),
        });

      expectToEqual(response.body, {
        status: 400,
        message:
          "This convention cannot be renewed, as it has status : 'READY_TO_SIGN'",
      });
      expectToEqual(response.status, 400);
    });

    it("403 - Fails if provided token does not have enough privileges", async () => {
      const response = await request
        .post(conventionMagicLinkRoutes.renewConvention.url)
        .send(renewedConventionParams)
        .set({
          authorization: createTokenForRole({
            role: "beneficiary",
            conventionId: existingConvention.id,
          }),
        });

      expectToEqual(response.body, {
        status: 403,
        message: "The role 'beneficiary' is not allowed to renew convention",
      });
      expectToEqual(response.status, 403);
    });
  });

  describe("POST /auth/sign-application/:conventionId", () => {
    it("200 - can sign with connected user (same email as establishement representative in convention)", async () => {
      const agency = new AgencyDtoBuilder().build();
      const validator = new ConnectedUserBuilder()
        .withId("validator")
        .withEmail("validator@mail.com")
        .buildUser();
      const convention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .notSigned()
        .build();
      const establishmentRepresentative: User = {
        email: convention.signatories.establishmentRepresentative.email,
        firstName: "",
        lastName: "",
        id: "1",
        proConnect: defaultProConnectInfos,
        createdAt: new Date().toISOString(),
      };

      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      ];
      inMemoryUow.userRepository.users = [
        establishmentRepresentative,
        validator,
      ];
      inMemoryUow.conventionRepository.setConventions([convention]);

      const response = await request
        .post(`/auth/sign-application/${convention.id}`)
        .send()
        .set({
          authorization: generateConnectedUserJwt({
            userId: establishmentRepresentative.id,
            version: 1,
          }),
        });
      expectToEqual(response.status, 200);
      expectToEqual(response.body, {
        id: "a99eaca1-ee70-4c90-b3f4-668d492f7392",
      });
    });

    it("403 - cannot sign with connected user (icUser email != convention establishment representative email)", async () => {
      const agency = new AgencyDtoBuilder().build();
      const validator = new ConnectedUserBuilder()
        .withId("validator")
        .withEmail("validator@mail.com")
        .buildUser();
      const convention = new ConventionDtoBuilder()
        .withAgencyId(agency.id)
        .withStatus("READY_TO_SIGN")
        .notSigned()
        .build();
      const notEstablishmentRepresentative: User = {
        email: "email@mail.com",
        firstName: "",
        lastName: "",
        id: "1",
        proConnect: defaultProConnectInfos,
        createdAt: new Date().toISOString(),
      };

      inMemoryUow.userRepository.users = [
        notEstablishmentRepresentative,
        validator,
      ];
      inMemoryUow.conventionRepository.setConventions([convention]);
      inMemoryUow.agencyRepository.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );

      const response = await request
        .post(`/auth/sign-application/${convention.id}`)
        .set({
          authorization: generateConnectedUserJwt({
            userId: notEstablishmentRepresentative.id,
            version: 1,
          }),
        })
        .send();

      expectObjectsToMatch(response, {
        status: 403,
        body: {
          status: 403,
          message: `User '${notEstablishmentRepresentative.id}' is not the establishment representative for convention '${convention.id}'`,
        },
      });
    });
  });

  describe("POST /auth/convention/signatories/send-signature-link", () => {
    it("200 - connected validator can send signature link to signatory", async () => {
      const agency = new AgencyDtoBuilder().build();
      const validator = new ConnectedUserBuilder()
        .withId("validator")
        .withEmail("validator@mail.com")
        .buildUser();
      const convention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .notSigned()
        .build();
      const establishmentRepresentative: User = {
        email: convention.signatories.establishmentRepresentative.email,
        firstName: "",
        lastName: "",
        id: "1",
        proConnect: defaultProConnectInfos,
        createdAt: new Date().toISOString(),
      };
      gateways.shortLinkGenerator.addMoreShortLinkIds(["shortLink1"]);

      inMemoryUow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      ];
      inMemoryUow.userRepository.users = [
        establishmentRepresentative,
        validator,
      ];
      inMemoryUow.conventionRepository.setConventions([convention]);

      const response = await httpClient.sendSignatureLink({
        body: {
          conventionId: convention.id,
          signatoryRole: "establishment-representative",
        },
        headers: {
          authorization: generateConnectedUserJwt({
            userId: validator.id,
            version: 1,
          }),
        },
      });
      expectToEqual(response.status, 200);
      expectToEqual(response.body, "");
    });
  });
});
