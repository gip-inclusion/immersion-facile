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
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../utils/agency";
import { createConventionMagicLinkPayload } from "../../../utils/jwt";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeGenerateJwtES256 } from "../../core/jwt";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
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
          [shortLinks[0]]: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: expectedRole,
            email: expectedEmail,
            now: timeGateway.now(),
            targetRoute: frontRoutes.conventionToSign,
          }),
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
          originalUrl: encodeURIComponent(
            "http://immersionfacile.fr/verifier-et-signer",
          ),
          expiredJwt: generateConventionJwt(expiredPayload),
        });

        expect(uow.outboxRepository.events).toHaveLength(1);
      });
    });

    describe("Wrong paths", () => {
      const email = "some email";

      it("requires a valid application id", async () => {
        const invalidConventionId: ConventionId = "not-a-valid-id";

        const request: RenewExpiredJwtRequestDto = {
          originalUrl: "https://immersionfacile.com/%jwt%",
          expiredJwt: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: invalidConventionId,
              role: "counsellor",
              email,
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
          originalUrl: "https://immersionfacile.com/%jwt%",
          expiredJwt: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: convention.id,
              role: "counsellor",
              email,
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
            originalUrl: "http://immersionfacile.fr/verifier-et-signer",
            expiredJwt: generateConventionJwt(
              createConventionMagicLinkPayload({
                id: validConvention.id,
                role: "back-office" as ConventionRole,
                email,
                now: timeGateway.now(),
              }),
            ),
          }),
          errors.convention.roleHasNoMagicLink({ role: "back-office" }),
        );
      });

      it("does not accept to renew links from url that are not supported", async () => {
        const request: RenewExpiredJwtRequestDto = {
          originalUrl: "immersionfacile.com/",
          expiredJwt: generateConventionJwt(
            createConventionMagicLinkPayload({
              id: validConvention.id,
              role: "counsellor",
              email,
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
});
