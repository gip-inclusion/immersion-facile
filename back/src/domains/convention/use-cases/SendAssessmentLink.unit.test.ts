import { addDays, subDays, subHours } from "date-fns";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyRole,
  type ConventionDto,
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
import {
  type SaveNotificationAndRelatedEvent,
  makeSaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
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
import type { EstablishmentUserRight } from "../../establishment/entities/EstablishmentAggregate";
import { EstablishmentAggregateBuilder } from "../../establishment/helpers/EstablishmentBuilders";
import {
  MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER,
  type SendAssessmentLink,
  makeSendAssessmentLink,
} from "./SendAssessmentLink";

const conventionId = "add5c20e-6dd2-45af-affe-927358005251";

const notConnectedUser = new UserBuilder()
  .withEmail("validator@mail.com")
  .build();
const validatorJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "validator",
  email: notConnectedUser.email,
  now: new Date(),
});

const connectedUserPayload: InclusionConnectDomainJwtPayload = {
  userId: "bcc5c20e-6dd2-45cf-affe-927358005262",
};

const connectedUserBuilder = new InclusionConnectedUserBuilder().withId(
  connectedUserPayload.userId,
);
const connectedUser = connectedUserBuilder.build();

describe("SendAssessmentLink", () => {
  const config = new AppConfigBuilder().build();
  let shortLinkIdGeneratorGateway: DeterministShortLinkIdGeneratorGateway;
  let uow: InMemoryUnitOfWork;
  let usecase: SendAssessmentLink;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let timeGateway: TimeGateway;
  let convention: ConventionDto;
  let agency: AgencyDto;

  beforeEach(() => {
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    const uuidGenerator = new UuidV4Generator();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    const createNewEvent = makeCreateNewEvent({ uuidGenerator, timeGateway });

    usecase = makeSendAssessmentLink({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent,
        generateConventionMagicLinkUrl: fakeGenerateMagicLinkUrlFn,
        timeGateway,
        shortLinkIdGeneratorGateway,
        config,
        createNewEvent,
      },
    });

    const conventionBuilder = new ConventionDtoBuilder()
      .withId(conventionId)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateEnd(timeGateway.now().toISOString())
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
      });

    convention = conventionBuilder.build();

    agency = new AgencyDtoBuilder().withId(convention.agencyId).build();
  });

  describe("wrong paths", () => {
    it("throws bad request if requested convention does not match the one in jwt", async () => {
      const wrongConventionId = "1dd5c20e-6dd2-45af-affe-927358005250";

      uow.conventionRepository.setConventions([convention]);
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
      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
          },
          validatorJwtPayload,
        ),
        errors.convention.notFound({
          conventionId,
        }),
      );
    });

    it("throws bad request if status is not ACCEPTED_BY_VALIDATOR", async () => {
      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withStatus("IN_REVIEW")
        .build();
      uow.userRepository.users = [notConnectedUser];

      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];
      uow.conventionRepository.setConventions([convention]);

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
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
      const convention = new ConventionDtoBuilder()
        .withId(conventionId)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withDateEnd(addDays(today, 2).toISOString())
        .build();
      uow.userRepository.users = [notConnectedUser];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];
      uow.conventionRepository.setConventions([convention]);

      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
          },
          validatorJwtPayload,
        ),
        errors.assessment.conventionEndingInMoreThanOneDay(),
      );
    });

    it("throws bad request if assessment is already filled", async () => {
      uow.userRepository.users = [notConnectedUser];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notConnectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];
      uow.conventionRepository.setConventions([convention]);
      uow.assessmentRepository.save({
        conventionId: conventionId,
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
            conventionId,
          },
          validatorJwtPayload,
        ),
        errors.assessment.assessmentAlreadyFullfilled(conventionId),
      );
    });

    describe("from connected user", () => {
      it("throws not found if connected user id does not exist", async () => {
        const unexistingUserPayload: InclusionConnectDomainJwtPayload = {
          userId: "bcc5c20e-6dd2-45cf-affe-927358005267",
        };
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
            },
            unexistingUserPayload,
          ),
          errors.user.notFound(unexistingUserPayload),
        );
      });

      it.each(["agency-admin", "agency-viewer", "to-review"] as AgencyRole[])(
        "throws unauthorized if agency user has not enough rights on convention",
        async (role) => {
          uow.userRepository.users = [connectedUser];
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [connectedUser.id]: { roles: [role], isNotifiedByEmail: true },
            }),
          ];
          uow.conventionRepository.setConventions([convention]);

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId,
              },
              connectedUserPayload,
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
          uow.userRepository.users = [connectedUser];
          const userRights: EstablishmentUserRight[] = [
            {
              userId: connectedUser.id,
              role,
              job: "job",
              phone: "phone",
            },
          ];
          const establishmentAggregateWithEmail =
            new EstablishmentAggregateBuilder()
              .withUserRights(userRights)
              .build();
          await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
            establishmentAggregateWithEmail,
          );
          uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
          uow.conventionRepository.setConventions([convention]);

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId,
              },
              connectedUserPayload,
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
          uow.userRepository.users = [notConnectedUser];
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [notConnectedUser.id]: {
                roles: [role],
                isNotifiedByEmail: true,
              },
            }),
          ];
          uow.conventionRepository.setConventions([convention]);

          const notConnectedUserJwtPayload = createConventionMagicLinkPayload({
            id: conventionId,
            role,
            email: notConnectedUser.email,
            now: new Date(),
          });

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId,
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

          uow.conventionRepository.setConventions([convention]);

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId,
              },
              {
                applicationId: conventionId,
                role,
                emailHash: "emailHash",
              },
            ),
            errors.convention.emailNotLinkedToConvention(role),
          );
        },
      );

      it(`throws too many requests if there was already a assessment link sent less than ${MIN_HOURS_BETWEEN_ASSESSMENT_REMINDER} hours before`, async () => {
        const shortLinkId = "link2";
        shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notConnectedUser.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
        ];
        uow.userRepository.users = [notConnectedUser];
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
              conventionId,
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
    const backofficeAdminPayload: InclusionConnectDomainJwtPayload = {
      userId: "bcc5c20e-6dd2-45cf-affe-927358005263",
    };
    const backofficeAdminBuilder = new InclusionConnectedUserBuilder().withId(
      backofficeAdminPayload.userId,
    );
    const backofficeAdmin = backofficeAdminBuilder.withIsAdmin(true).build();

    const counsellorJwtPayload = createConventionMagicLinkPayload({
      id: conventionId,
      role: "counsellor",
      email: notConnectedUser.email,
      now: new Date(),
    });

    it.each(["validator", "counsellor"] as const)(
      "When pro connected %s triggers it",
      async (role) => {
        const shortLinkId = "link1";
        shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [connectedUser.id]: {
              roles: [role],
              isNotifiedByEmail: false,
            },
          }),
        ];
        uow.userRepository.users = [connectedUser];

        await usecase.execute(
          {
            conventionId,
          },
          connectedUserPayload,
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
      const shortLinkId = "link1";
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

      uow.conventionRepository.setConventions([convention]);
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
      uow.userRepository.users = [backofficeAdmin];

      await usecase.execute(
        {
          conventionId,
        },
        backofficeAdminPayload,
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
        const shortLinkId = "link1";
        shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

        const convention = new ConventionDtoBuilder()
          .withId(conventionId)
          .withStatus("ACCEPTED_BY_VALIDATOR")
          .withDateEnd(timeGateway.now().toISOString())
          .build();

        const agencyWithEmails = toAgencyWithRights(
          new AgencyDtoBuilder().withId(convention.agencyId).build(),
          {
            [notConnectedUser.id]: {
              roles: [role],
              isNotifiedByEmail: true,
            },
          },
        );

        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [agencyWithEmails];
        uow.userRepository.users = [notConnectedUser];

        await usecase.execute(
          {
            conventionId,
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
          id: conventionId,
          role: role,
          email: signatoryEmail,
          now: new Date(),
        });
        const shortLinkId = "link1";
        shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);

        const conventionBuilder = new ConventionDtoBuilder()
          .withId(conventionId)
          .withStatus("ACCEPTED_BY_VALIDATOR")
          .withDateEnd(timeGateway.now().toISOString())
          .withBeneficiaryEmail(signatoryEmail)
          .withBeneficiaryRepresentative({
            email: signatoryEmail,
            firstName: "Robert",
            lastName: "Thénardier",
            phone: "",
            role: "beneficiary-representative",
          })
          .withBeneficiaryCurrentEmployer({
            email: signatoryEmail,
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
            email: signatoryEmail,
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
          });

        const conventionWithSignatory = conventionBuilder.build();

        uow.conventionRepository.setConventions([conventionWithSignatory]);
        uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
        uow.userRepository.users = [notConnectedUser];

        await usecase.execute(
          {
            conventionId,
          },
          signatoryJwtPayload,
        );

        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          { topic: "NotificationAdded" },
          {
            topic: "AssessmentReminderManuallySent",
            payload: {
              convention: conventionWithSignatory,
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
              conventionId: conventionWithSignatory.id,
              agencyId: conventionWithSignatory.agencyId,
              establishmentSiret: conventionWithSignatory.siret,
              userId: undefined,
            },
            templatedContent: {
              recipientPhone: conventionWithSignatory.establishmentTutor.phone,
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
      const shortLinkId = "link1";
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
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
      uow.userRepository.users = [notConnectedUser];

      await usecase.execute(
        {
          conventionId,
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
      const shortLinkId = "link2";
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
      shortLinkIdGeneratorGateway.addMoreShortLinkIds([shortLinkId]);
      uow.conventionRepository.setConventions([convention]);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [connectedUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        }),
      ];
      uow.userRepository.users = [connectedUser];
      uow.notificationRepository.notifications = [pastSmsNotification];

      await usecase.execute(
        {
          conventionId,
        },
        connectedUserPayload,
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
    // it.each(["validator", "counsellor"] as const)(
    //   "when agency user %s triggers it",
    //   () => {},
    // );

    // it.each([
    //   "beneficiary",
    //   "establishment-representative",
    //   "beneficiary-current-employer",
    //   "beneficiary-representative",
    // ] as const)("when signatory %s triggers it", () => {});
  });
});
