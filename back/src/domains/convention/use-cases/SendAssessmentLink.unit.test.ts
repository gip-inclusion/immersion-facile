import { addDays, subDays, subHours } from "date-fns";
import {
  AgencyDtoBuilder,
  type AgencyRole,
  ConventionDtoBuilder,
  type EstablishmentRole,
  type InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  type Notification,
  type SignatoryRole,
  UserBuilder,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
} from "shared";
import { AppConfigBuilder } from "../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../utils/agency";
import { createConventionMagicLinkPayload } from "../../../utils/jwt";
import { fakeGenerateMagicLinkUrlFn } from "../../../utils/jwtTestHelper";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { makeShortLinkUrl } from "../../core/short-link/ShortLink";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../../establishment/helpers/EstablishmentBuilders";
import {
  MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER,
  type SendAssessmentLink,
  makeSendAssessmentLink,
} from "./SendAssessmentLink";

describe("SendAssessmentLink", () => {
  const config = new AppConfigBuilder().build();
  let uow: InMemoryUnitOfWork;
  let usecase: SendAssessmentLink;
  let timeGateway: TimeGateway;

  const now = new Date();

  const shortLinkId = "link1";

  const convention = new ConventionDtoBuilder()
    .withId("add5c20e-6dd2-45af-affe-927358005251")
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withDateEnd(now.toISOString())
    .withBeneficiaryEmail("beneficiary@mail.com")
    .withBeneficiaryRepresentative({
      email: "beneficiary-representative@mail.com",
      firstName: "Robert",
      lastName: "Thénardier",
      phone: "",
      role: "beneficiary-representative",
    })
    .withBeneficiaryCurrentEmployer({
      email: "beneficiary-current-employer@mail.com",
      firstName: "Robert",
      lastName: "Thénardier",
      phone: "",
      role: "beneficiary-current-employer",
      businessName: "",
      businessSiret: "",
      job: "",
      signedAt: undefined,
      businessAddress: "Rue des Bouchers 67065 Strasbourg",
    })
    .withEstablishmentRepresentative({
      email: "establishment-representative@mail.com",
      firstName: "Robert",
      lastName: "Thénardier",
      phone: "",
      role: "establishment-representative",
    })
    .withEstablishmentTutor({
      email: "tutor@mail.com",
      firstName: "Robert",
      lastName: "Thénardier",
      phone: "+33612345679",
      role: "establishment-tutor",
      job: "Tutor",
    })
    .build();

  const agency = new AgencyDtoBuilder().withId(convention.agencyId).build();

  const notConnectedUser = new UserBuilder()
    .withEmail("validator@mail.com")
    .build();

  const connectedUser = new InclusionConnectedUserBuilder()
    .withId("bcc5c20e-6dd2-45cf-affe-927358005262")
    .build();

  const backofficeAdmin = new InclusionConnectedUserBuilder()
    .withId("bcc5c20e-6dd2-45cf-affe-927358005263")
    .withIsAdmin(true)
    .build();

  const validatorJwtPayload = createConventionMagicLinkPayload({
    id: convention.id,
    role: "validator",
    email: notConnectedUser.email,
    now: new Date(),
  });

  const counsellorJwtPayload = createConventionMagicLinkPayload({
    id: convention.id,
    role: "counsellor",
    email: notConnectedUser.email,
    now: new Date(),
  });

  beforeEach(() => {
    timeGateway = new CustomTimeGateway(now);
    uow = createInMemoryUow();
    const shortLinkIdGeneratorGateway =
      new DeterministShortLinkIdGeneratorGateway();
    const uuidGenerator = new UuidV4Generator();

    usecase = makeSendAssessmentLink({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          uuidGenerator,
          timeGateway,
        ),
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
        timeGateway,
        shortLinkIdGeneratorGateway,
        config,
        createNewEvent: makeCreateNewEvent({ uuidGenerator, timeGateway }),
      },
    });

    shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
    uow.conventionRepository.setConventions([convention]);
    uow.userRepository.users = [
      notConnectedUser,
      connectedUser,
      backofficeAdmin,
    ];
  });

  describe("wrong paths", () => {
    it("throws bad request if requested convention does not match the one in jwt", async () => {
      const wrongConventionId = "1dd5c20e-6dd2-45af-affe-927358005250";

      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId: convention.id,
          },
          { ...validatorJwtPayload, applicationId: wrongConventionId },
        ),
        errors.convention.forbiddenMissingRights({
          conventionId: convention.id,
        }),
      );
    });

    it("throws not found if convention does not exist", async () => {
      uow.conventionRepository.setConventions([]);

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId: convention.id,
          },
          validatorJwtPayload,
        ),
        errors.convention.notFound({
          conventionId: convention.id,
        }),
      );
    });

    it("throws bad request if status is not ACCEPTED_BY_VALIDATOR", async () => {
      const conventionWithWrongStatus = new ConventionDtoBuilder(convention)
        .withStatus("IN_REVIEW")
        .build();

      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];
      uow.conventionRepository.setConventions([conventionWithWrongStatus]);

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId: conventionWithWrongStatus.id,
          },
          validatorJwtPayload,
        ),
        errors.assessment.sendAssessmentLinkNotAllowedForStatus({
          status: "IN_REVIEW",
        }),
      );
    });

    it("throws bad request if immersion ends in more than 1 day", async () => {
      const today = timeGateway.now();
      const conventionWithDateEndInMoreThan1Days = new ConventionDtoBuilder(
        convention,
      )
        .withDateEnd(addDays(today, 2).toISOString())
        .build();

      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];
      uow.conventionRepository.setConventions([
        conventionWithDateEndInMoreThan1Days,
      ]);

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId: conventionWithDateEndInMoreThan1Days.id,
          },
          validatorJwtPayload,
        ),
        errors.assessment.conventionEndingInMoreThanOneDay(),
      );
    });

    it("throws bad request if assessment is already filled", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];

      uow.assessmentRepository.save({
        conventionId: convention.id,
        status: "COMPLETED",
        endedWithAJob: false,
        establishmentFeedback: "establishmentFeedback",
        establishmentAdvices: "establishmentAdvices",
        numberOfHoursActuallyMade: 10,
        _entityName: "Assessment",
      });

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId: convention.id,
          },
          validatorJwtPayload,
        ),
        errors.assessment.assessmentAlreadyFullfilled(convention.id),
      );
    });

    describe("from connected user", () => {
      it("throws not found if connected user id does not exist", async () => {
        const unexistingUserPayload: InclusionConnectDomainJwtPayload = {
          userId: "bcc5c20e-6dd2-45cf-affe-927358005267",
        };
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: convention.id,
            },
            unexistingUserPayload,
          ),
          errors.user.notFound(unexistingUserPayload),
        );
      });

      it.each(["agency-admin", "agency-viewer", "to-review"] as AgencyRole[])(
        "throws unauthorized if agency user has not enough rights on convention",
        async (role) => {
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [connectedUser.id]: { roles: [role], isNotifiedByEmail: true },
            }),
          ];

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId: convention.id,
              },
              { userId: connectedUser.id },
            ),
            errors.user.notEnoughRightOnAgency({
              userId: connectedUser.id,
              agencyId: agency.id,
            }),
          );
        },
      );

      it.each([
        "establishment-admin",
        "establishment-contact",
      ] as EstablishmentRole[])(
        "throws unauthorized if establishment user has not enough rights on convention",
        async (role) => {
          await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
            new EstablishmentAggregateBuilder()
              .withUserRights([
                {
                  userId: connectedUser.id,
                  role,
                  job: "job",
                  phone: "phone",
                },
              ])
              .build(),
          );
          uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId: convention.id,
              },
              { userId: connectedUser.id },
            ),
            errors.assessment.sendAssessmentLinkForbidden(),
          );
        },
      );
    });

    describe("from magiclink", () => {
      it.each(["agency-admin", "agency-viewer", "to-review"] as AgencyRole[])(
        "throws unauthorized if user has not enough rights on agency",
        async (role) => {
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [notConnectedUser.id]: {
                roles: [role],
                isNotifiedByEmail: true,
              },
            }),
          ];

          const notConnectedUserJwtPayload = createConventionMagicLinkPayload({
            id: convention.id,
            role,
            email: notConnectedUser.email,
            now: new Date(),
          });

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId: convention.id,
              },
              notConnectedUserJwtPayload,
            ),
            errors.assessment.sendAssessmentLinkForbidden(),
          );
        },
      );

      it.each([
        "beneficiary-representative",
        "beneficiary-current-employer",
        "beneficiary",
        "establishment-representative",
      ] as SignatoryRole[])(
        "throws unauthorized if signatory has no rights on convention",
        async (role) => {
          uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId: convention.id,
              },
              {
                applicationId: convention.id,
                role,
                emailHash: "emailHash",
              },
            ),
            errors.convention.emailNotLinkedToConvention(role),
          );
        },
      );

      it(`throws too many requests if there was already a assessment link sent less than ${MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER} hours before`, async () => {
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notConnectedUser.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
        ];
        uow.notificationRepository.notifications = [
          {
            id: "past-notification-id",
            createdAt: subHours(timeGateway.now(), 2).toISOString(),
            kind: "sms",
            followedIds: {
              conventionId: convention.id,
              agencyId: convention.agencyId,
              establishmentSiret: convention.siret,
              userId: undefined,
            },
            templatedContent: {
              recipientPhone: convention.establishmentTutor.phone,
              kind: "ReminderForAssessment",
              params: {
                shortLink: makeShortLinkUrl(config, "shortLink"),
              },
            },
          },
        ];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: convention.id,
            },
            validatorJwtPayload,
          ),
          errors.assessment.smsAssessmentLinkAlreadySent({
            minHoursBetweenReminder: MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER,
            timeRemaining: "22h00",
          }),
        );
      });
    });
  });

  describe("right paths: send assessment link", () => {
    it.each(["validator", "counsellor"] as const)(
      "When pro connected %s triggers it",
      async (role) => {
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [connectedUser.id]: {
              roles: [role],
              isNotifiedByEmail: false,
            },
          }),
        ];

        await usecase.execute(
          {
            conventionId: convention.id,
          },
          { userId: connectedUser.id },
        );

        expectToEqual(uow.shortLinkQuery.getShortLinks(), {
          [shortLinkId]: fakeGenerateMagicLinkUrlFn({
            id: convention.id,
            role: convention.establishmentTutor.role,
            email: convention.establishmentTutor.email,
            now: timeGateway.now(),
            targetRoute: frontRoutes.assessment,
            extraQueryParams: { mtm_source: "sms-assessment-link" },
          }),
        });

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          { topic: "NotificationAdded" },
          {
            topic: "AssessmentReminderManuallySent",
            payload: {
              convention,
              transport: "sms",
              triggeredBy: {
                kind: "inclusion-connected",
                userId: connectedUser.id,
              },
            },
          },
        ]);
        expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
          {
            kind: "sms",
            followedIds: {
              conventionId: convention.id,
              agencyId: convention.agencyId,
              establishmentSiret: convention.siret,
              userId: connectedUser.id,
            },
            templatedContent: {
              recipientPhone: convention.establishmentTutor.phone,
              kind: "ReminderForAssessment",
              params: {
                shortLink: makeShortLinkUrl(config, shortLinkId),
              },
            },
          },
        ]);
      },
    );

    it("When backoffice admin triggers it", async () => {
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

      await usecase.execute(
        {
          conventionId: convention.id,
        },
        { userId: backofficeAdmin.id },
      );

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
        { topic: "AssessmentReminderManuallySent" },
      ]);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        {
          kind: "sms",
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
            userId: backofficeAdmin.id,
          },
          templatedContent: {
            recipientPhone: convention.establishmentTutor.phone,
            kind: "ReminderForAssessment",
            params: {
              shortLink: makeShortLinkUrl(config, shortLinkId),
            },
          },
        },
      ]);
    });

    it.each(["validator", "counsellor"] as const)(
      "When not connected agency user %s triggers it",
      async (role) => {
        const agencyWithEmails = toAgencyWithRights(
          new AgencyDtoBuilder().withId(convention.agencyId).build(),
          {
            [notConnectedUser.id]: {
              roles: [role],
              isNotifiedByEmail: true,
            },
          },
        );

        uow.agencyRepository.agencies = [agencyWithEmails];

        await usecase.execute(
          {
            conventionId: convention.id,
          },
          role === "validator" ? validatorJwtPayload : counsellorJwtPayload,
        );

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          { topic: "NotificationAdded" },
          {
            topic: "AssessmentReminderManuallySent",
            payload: {
              convention,
              transport: "sms",
              triggeredBy: {
                kind: "convention-magic-link",
                role,
              },
            },
          },
        ]);
        expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
          {
            kind: "sms",
            followedIds: {
              conventionId: convention.id,
              agencyId: convention.agencyId,
              establishmentSiret: convention.siret,
              userId: undefined,
            },
            templatedContent: {
              recipientPhone: convention.establishmentTutor.phone,
              kind: "ReminderForAssessment",
              params: {
                shortLink: makeShortLinkUrl(config, shortLinkId),
              },
            },
          },
        ]);
      },
    );

    it.each([
      "beneficiary",
      "beneficiary-representative",
      "beneficiary-current-employer",
      "establishment-representative",
    ] as SignatoryRole[])(
      "When not connected signatory %s triggers it",
      async (role) => {
        const signatoryEmail = `${role}@mail.com`;
        const signatoryJwtPayload = createConventionMagicLinkPayload({
          id: convention.id,
          role: role,
          email: signatoryEmail,
          now: new Date(),
        });

        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];

        await usecase.execute(
          {
            conventionId: convention.id,
          },
          signatoryJwtPayload,
        );

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          { topic: "NotificationAdded" },
          {
            topic: "AssessmentReminderManuallySent",
            payload: {
              convention,
              transport: "sms",
              triggeredBy: {
                kind: "convention-magic-link",
                role,
              },
            },
          },
        ]);
        expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
          {
            kind: "sms",
            followedIds: {
              conventionId: convention.id,
              agencyId: convention.agencyId,
              establishmentSiret: convention.siret,
              userId: undefined,
            },
            templatedContent: {
              recipientPhone: convention.establishmentTutor.phone,
              kind: "ReminderForAssessment",
              params: {
                shortLink: makeShortLinkUrl(config, shortLinkId),
              },
            },
          },
        ]);
      },
    );

    it.each([
      "+33600000000", // metropole
      "+33785689727", // metropole
      "+262639000001", // Mayotte
      "+590690000001", // Guadeloupe
      "+590691282545", // Guadeloupe
      "+594694000001", // Guyane
      "+596696000001", // Martinique
      "+262692000001", // Réunion
      "+262693000001", // Réunion
      "+68987770076", // polynesie française
      "+687751234", // nouvelle calédonie
      "+681821234", // wallis et futuna
      "+508551234", // saint pierre et miquelon
    ])("for phone number %s", async (phoneNumber) => {
      const conventionWithCustomPhoneNumer = new ConventionDtoBuilder(
        convention,
      )
        .withBeneficiaryPhone(phoneNumber)
        .build();

      const agencyWithValidatorEmails = toAgencyWithRights(agency, {
        [notConnectedUser.id]: {
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      });

      uow.conventionRepository.setConventions([conventionWithCustomPhoneNumer]);
      uow.agencyRepository.agencies = [agencyWithValidatorEmails];

      await usecase.execute(
        {
          conventionId: conventionWithCustomPhoneNumer.id,
        },
        validatorJwtPayload,
      );

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
        { topic: "AssessmentReminderManuallySent" },
      ]);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        {
          kind: "sms",
          followedIds: {
            conventionId: conventionWithCustomPhoneNumer.id,
            agencyId: conventionWithCustomPhoneNumer.agencyId,
            establishmentSiret: conventionWithCustomPhoneNumer.siret,
            userId: undefined,
          },
          templatedContent: {
            recipientPhone:
              conventionWithCustomPhoneNumer.establishmentTutor.phone,
            kind: "ReminderForAssessment",
            params: {
              shortLink: makeShortLinkUrl(config, shortLinkId),
            },
          },
        },
      ]);
    });

    it(`send signature link if last signature link was sent more than ${MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER} hours ago`, async () => {
      const pastSmsNotification: Notification = {
        id: "past-notification-id",
        createdAt: subDays(timeGateway.now(), 2).toISOString(),
        kind: "sms",
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
          userId: connectedUser.id,
        },
        templatedContent: {
          recipientPhone: convention.establishmentTutor.phone,
          kind: "ReminderForAssessment",
          params: {
            shortLink: makeShortLinkUrl(config, shortLinkId),
          },
        },
      };

      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [connectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];
      uow.notificationRepository.notifications = [pastSmsNotification];

      await usecase.execute(
        {
          conventionId: convention.id,
        },
        { userId: connectedUser.id },
      );

      expectObjectInArrayToMatch(uow.outboxRepository.events, [
        { topic: "NotificationAdded" },
        { topic: "AssessmentReminderManuallySent" },
      ]);
      expectObjectInArrayToMatch(uow.notificationRepository.notifications, [
        pastSmsNotification,
        {
          kind: "sms",
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
            userId: connectedUser.id,
          },
          templatedContent: {
            recipientPhone: convention.establishmentTutor.phone,
            kind: "ReminderForAssessment",
            params: {
              shortLink: makeShortLinkUrl(config, shortLinkId),
            },
          },
        },
      ]);
    });
  });
});
