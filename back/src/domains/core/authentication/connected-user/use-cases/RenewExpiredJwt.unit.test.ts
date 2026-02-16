import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionRole,
  type Email,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
  type RenewExpiredJwtRequestDto,
} from "shared";
import { v4 as uuid } from "uuid";
import type { AppConfig } from "../../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../../utils/agency";
import {
  createConnectedUserJwtPayload,
  createConventionMagicLinkPayload,
  createEmailAuthCodeJwtPayload,
} from "../../../../../utils/jwt";
import {
  fakeGenerateConnectedUserUrlFn,
  fakeGenerateEmailAuthCodeUrlFn,
  fakeGenerateMagicLinkUrlFn,
} from "../../../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeGenerateJwtES256 } from "../../../jwt";
import { makeSaveNotificationAndRelatedEvent } from "../../../notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../../short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import type { OngoingOAuth } from "../entities/OngoingOAuth";
import { RenewExpiredJwt } from "./RenewExpiredJwt";

describe("RenewExpiredJwt use case", () => {
  const validator = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail("validator@mail.com")
    .buildUser();

  const counsellor = new ConnectedUserBuilder()
    .withId(uuid())
    .withEmail("counsellor@mail.com")
    .buildUser();

  const defaultAgency = AgencyDtoBuilder.create().build();

  const validConvention: ConventionDto = new ConventionDtoBuilder()
    .withAgencyId(defaultAgency.id)
    .withBeneficiaryCurrentEmployer({
      email: "currentEmployer@mail.com",
      businessName: "",
      businessSiret: "",
      firstName: "",
      lastName: "",
      job: "",
      role: "beneficiary-current-employer",
      phone: "",
      businessAddress: "Rue des Bouchers 67065 Strasbourg",
    })
    .withBeneficiaryRepresentative({
      email: "beneficiaryRepresentative@mail.com",
      firstName: "",
      lastName: "",
      phone: "",
      role: "beneficiary-representative",
    })
    .build();

  const config: AppConfig = new AppConfigBuilder()
    .withTestPresetPreviousKeys()
    .build();

  const timeGateway = new CustomTimeGateway(new Date());

  let uow: InMemoryUnitOfWork;
  let useCase: RenewExpiredJwt;
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    const uuidGenerator = new TestUuidGenerator();
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    useCase = new RenewExpiredJwt({
      uowPerformer: new InMemoryUowPerformer(uow),
      makeGenerateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
      makeGenerateConnectedUserLoginUrl: fakeGenerateConnectedUserUrlFn,
      makeGenerateEmailAuthCodeUrl: fakeGenerateEmailAuthCodeUrlFn,
      config,
      timeGateway,
      shortLinkIdGeneratorGateway,
      saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
        uuidGenerator,
        timeGateway,
      ),
    });

    uow.agencyRepository.agencies = [
      toAgencyWithRights(defaultAgency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        [counsellor.id]: { isNotifiedByEmail: true, roles: ["counsellor"] },
      }),
    ];
    uow.conventionRepository.setConventions([validConvention]);
    uow.userRepository.users = [validator, counsellor];
  });

  describe("With convention JWT", () => {
    const generateConventionJwt = makeGenerateJwtES256<"convention">(
      config.jwtPrivateKey,
      undefined,
    );

    describe("Right paths", () => {
      it.each<[ConventionRole, Email]>([
        ["beneficiary", validConvention.signatories.beneficiary.email],
        [
          "beneficiary-current-employer",
          // biome-ignore lint/style/noNonNullAssertion: provided
          validConvention.signatories.beneficiaryCurrentEmployer!.email,
        ],
        [
          "beneficiary-representative",
          // biome-ignore lint/style/noNonNullAssertion: provided
          validConvention.signatories.beneficiaryRepresentative!.email,
        ],
        [
          "establishment-representative",
          validConvention.signatories.establishmentRepresentative.email,
        ],
        ["establishment-tutor", validConvention.establishmentTutor.email],
        ["counsellor", counsellor.email],
        ["validator", validator.email],
      ])("Posts an event to deliver a correct JWT for correct responses for role %s", async (expectedRole, expectedEmail) => {
        const expiredPayload = createConventionMagicLinkPayload({
          id: validConvention.id,
          role: expectedRole,
          email: expectedEmail,
          now: timeGateway.now(),
        });

        const shortLinks = ["shortLink1", "shortLink2"];
        shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinks);

        await useCase.execute({
          kind: "convention",
          originalUrl: "http://immersionfacile.fr/verifier-et-signer",
          expiredJwt: generateConventionJwt(expiredPayload),
        });

        expectSavedNotificationsAndEvents({
          emails: [
            {
              kind: "MAGIC_LINK_RENEWAL",
              params: {
                conventionId: validConvention.id,
                internshipKind: validConvention.internshipKind,
                magicLink: `${config.immersionFacileBaseUrl}/api/to/${shortLinks[0]}`,
              },
              recipients: [expectedEmail],
            },
          ],
        });

        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinks[0]]: {
            url: fakeGenerateMagicLinkUrlFn({
              id: validConvention.id,
              role: expectedRole,
              email: expectedEmail,
              now: timeGateway.now(),
              targetRoute: frontRoutes.conventionToSign,
            }),
            singleUse: false,
            lastUsedAt: null,
          },
        });
      });

      it("Also work when using encoded Url", async () => {
        shortLinkIdGeneratorGateway.addMoreShortLinkIds([
          "shortLink1",
          "shortLink2",
        ]);
        const expiredPayload = createConventionMagicLinkPayload({
          id: validConvention.id,
          role: "beneficiary",
          email: validConvention.signatories.beneficiary.email,
          now: timeGateway.now(),
        });

        await useCase.execute({
          kind: "convention",
          originalUrl: encodeURIComponent(
            "http://immersionfacile.fr/verifier-et-signer",
          ),
          expiredJwt: generateConventionJwt(expiredPayload),
        });

        expect(uow.outboxRepository.events).toHaveLength(1);
      });
    });

    describe("Wrong paths", () => {
      it("requires a valid application id", async () => {
        const invalidConventionId: ConventionId = "not-a-valid-id";

        const request: RenewExpiredJwtRequestDto = {
          kind: "convention",
          originalUrl: "https://immersionfacile.com/%jwt%",
          expiredJwt: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: invalidConventionId,
              role: "counsellor",
              email: counsellor.email,
              now: timeGateway.now(),
            }),
          ),
        };

        await expectPromiseToFailWithError(
          useCase.execute(request),
          errors.convention.notFound({ conventionId: invalidConventionId }),
        );
      });

      it("requires a known agency id", async () => {
        const storedUnknownId = "some unknown agency id";
        const convention = new ConventionDtoBuilder()
          .withAgencyId(storedUnknownId)
          .build();
        uow.conventionRepository.setConventions([convention]);

        const request: RenewExpiredJwtRequestDto = {
          kind: "convention",
          originalUrl: "https://immersionfacile.com/%jwt%",
          expiredJwt: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: convention.id,
              role: "counsellor",
              email: counsellor.email,
              now: timeGateway.now(),
            }),
          ),
        };

        await expectPromiseToFailWithError(
          useCase.execute(request),
          errors.agency.notFound({ agencyId: storedUnknownId }),
        );
      });

      // Admins use non-magic-link based authentication, so no need to renew these.
      it("Refuses to generate backoffice magic links", async () => {
        await expectPromiseToFailWithError(
          useCase.execute({
            kind: "convention",
            originalUrl: "http://immersionfacile.fr/verifier-et-signer",
            expiredJwt: generateConventionJwt(
              createConventionMagicLinkPayload({
                id: validConvention.id,
                role: "back-office" as ConventionRole,
                email: counsellor.email,
                now: timeGateway.now(),
              }),
            ),
          }),
          errors.convention.roleHasNoMagicLink({ role: "back-office" }),
        );
      });

      it("does not accept to renew links from url that are not supported", async () => {
        const request: RenewExpiredJwtRequestDto = {
          kind: "convention",
          originalUrl: "immersionfacile.com/",
          expiredJwt: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: validConvention.id,
              role: "counsellor",
              email: counsellor.email,
              now: timeGateway.now(),
            }),
          ),
        };

        await expectPromiseToFailWithError(
          useCase.execute(request),
          errors.convention.unsupportedRenewRoute({
            originalUrl: request.originalUrl,
            supportedRenewRoutes: [
              "demande-immersion",
              "verifier-et-signer",
              "pilotage-convention",
              "bilan-immersion",
              "bilan-document",
            ],
          }),
        );
      });
    });
  });

  describe("With ConnectedUser Jwt", () => {
    const generateConnectedUserJwt = makeGenerateJwtES256<"connectedUser">(
      config.jwtPrivateKey,
      undefined,
    );
    const user = new ConnectedUserBuilder().buildUser();
    const onGoingOAuthFromUri =
      "/tableau-de-bord-etablissement/discussions/00000000-0000-0000-0000-000000000000";

    const expiredPayload = createConnectedUserJwtPayload({
      userId: user.id,
      durationHours: 1,
      now: timeGateway.now(),
    });

    const emailUsedOnGoingOAuth: OngoingOAuth = {
      email: user.email,
      userId: user.id,
      fromUri: onGoingOAuthFromUri,
      nonce: "fake-nonce",
      provider: "email",
      state: "fake-state",
      usedAt: new Date(),
    };

    beforeEach(() => {
      uow.userRepository.users = [user];
      uow.ongoingOAuthRepository.ongoingOAuths = [emailUsedOnGoingOAuth];
    });

    it("Sends a magiclink renewal email including a shortlink mapped to ConnectedUserUrl with renewed JWT", async () => {
      const shortLinks = ["shortLink1"];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinks);

      await useCase.execute({
        kind: "connectedUser",
        expiredJwt: generateConnectedUserJwt(expiredPayload),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "MAGIC_LINK_RENEWAL",
            params: {
              magicLink: `${config.immersionFacileBaseUrl}/api/to/${shortLinks[0]}`,
            },
            recipients: [user.email],
          },
        ],
      });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinks[0]]: {
          url: fakeGenerateConnectedUserUrlFn({
            accessToken: undefined,
            user,
            ongoingOAuth: emailUsedOnGoingOAuth,
            now: timeGateway.now(),
          }),
          singleUse: false,
          lastUsedAt: null,
        },
      });
    });

    describe("Wrong paths", () => {
      it("with missing user", async () => {
        uow.userRepository.users = [];

        expectPromiseToFailWithError(
          useCase.execute({
            kind: "connectedUser",
            expiredJwt: generateConnectedUserJwt(expiredPayload),
          }),
          errors.user.notFound({ userId: user.id }),
        );
      });

      it("with unused ongoingOAuth", () => {
        uow.ongoingOAuthRepository.ongoingOAuths = [
          {
            ...emailUsedOnGoingOAuth,
            usedAt: null,
          },
        ];

        expectPromiseToFailWithError(
          useCase.execute({
            kind: "connectedUser",
            expiredJwt: generateConnectedUserJwt(expiredPayload),
          }),
          errors.auth.unusedOAuth(),
        );
      });

      it("with ongoingOAuth that have a unsupported provider : ProConnect", () => {
        const unsupportedOngoingOAuth: OngoingOAuth = {
          ...emailUsedOnGoingOAuth,
          provider: "proConnect",
        };

        uow.ongoingOAuthRepository.ongoingOAuths = [unsupportedOngoingOAuth];

        expectPromiseToFailWithError(
          useCase.execute({
            kind: "connectedUser",
            expiredJwt: generateConnectedUserJwt(expiredPayload),
          }),
          errors.auth.otherRenewalNotSupported(
            unsupportedOngoingOAuth.provider,
          ),
        );
      });

      it("with missing onGoingOAuth", () => {
        uow.ongoingOAuthRepository.ongoingOAuths = [];

        expectPromiseToFailWithError(
          useCase.execute({
            kind: "connectedUser",
            expiredJwt: generateConnectedUserJwt(expiredPayload),
          }),
          errors.auth.missingOAuth({}),
        );
      });
    });
  });

  describe("With EmailAuthCode Jwt", () => {
    const generateEmailAuthCodeJwt = makeGenerateJwtES256<"emailAuthCode">(
      config.jwtPrivateKey,
      undefined,
    );

    const user = new ConnectedUserBuilder().buildUser();
    const onGoingOAuthFromUri =
      "/tableau-de-bord-etablissement/discussions/00000000-0000-0000-0000-000000000000";

    const expiredPayload = createEmailAuthCodeJwtPayload({
      emailAuthCode: true,
      durationMinutes: 1,
      now: timeGateway.now(),
    });

    const emailUnusedOnGoingOAuth: OngoingOAuth = {
      email: user.email,
      userId: user.id,
      fromUri: onGoingOAuthFromUri,
      nonce: "fake-nonce",
      provider: "email",
      state: "fake-state",
      usedAt: null,
    };

    beforeEach(() => {
      uow.userRepository.users = [user];
      uow.ongoingOAuthRepository.ongoingOAuths = [emailUnusedOnGoingOAuth];
    });

    it("Sends a magiclink renewal email including a shortlink mapped to ConnectedUserUrl with renewed JWT", async () => {
      const shortLinks = ["shortLink1"];
      shortLinkIdGeneratorGateway.addMoreShortLinkIds(shortLinks);

      await useCase.execute({
        kind: "emailAuthCode",
        state: emailUnusedOnGoingOAuth.state,
        expiredJwt: generateEmailAuthCodeJwt(expiredPayload),
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "MAGIC_LINK_RENEWAL",
            params: {
              magicLink: `${config.immersionFacileBaseUrl}/api/to/${shortLinks[0]}`,
            },
            recipients: [user.email],
          },
        ],
      });

      expectToEqual(uow.shortLinkQuery.getShortLinks(), {
        [shortLinks[0]]: {
          url: fakeGenerateEmailAuthCodeUrlFn({
            email: user.email,
            state: emailUnusedOnGoingOAuth.state,
            uri: frontRoutes.magicLinkInterstitial,
            now: timeGateway.now(),
          }),
          singleUse: false,
          lastUsedAt: null,
        },
      });
    });

    describe("Wrong paths", () => {
      it("unused oauth", () => {
        uow.ongoingOAuthRepository.ongoingOAuths = [
          {
            ...emailUnusedOnGoingOAuth,
            usedAt: new Date(),
          },
        ];

        expectPromiseToFailWithError(
          useCase.execute({
            kind: "emailAuthCode",
            state: emailUnusedOnGoingOAuth.state,
            expiredJwt: generateEmailAuthCodeJwt(expiredPayload),
          }),
          errors.auth.alreadyUsedAuthentication(),
        );
      });

      it("unsupported oauth provider", () => {
        uow.ongoingOAuthRepository.ongoingOAuths = [
          {
            ...emailUnusedOnGoingOAuth,
            provider: "proConnect",
          },
        ];

        expectPromiseToFailWithError(
          useCase.execute({
            kind: "emailAuthCode",
            state: emailUnusedOnGoingOAuth.state,
            expiredJwt: generateEmailAuthCodeJwt(expiredPayload),
          }),
          errors.auth.otherRenewalNotSupported("proConnect"),
        );
      });

      it("missing oauth", () => {
        uow.ongoingOAuthRepository.ongoingOAuths = [];

        expectPromiseToFailWithError(
          useCase.execute({
            kind: "emailAuthCode",
            state: emailUnusedOnGoingOAuth.state,
            expiredJwt: generateEmailAuthCodeJwt(expiredPayload),
          }),
          errors.auth.missingOAuth({ state: emailUnusedOnGoingOAuth.state }),
        );
      });
    });
  });
});
