import {
  type AbsoluteUrl,
  AgencyDtoBuilder,
  type AgencyWithUsersRights,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  conventionStatuses,
  errors,
  expectPromiseToFailWithError,
  frontRoutes,
  getDisplayedBusinessName,
  getFormattedFirstnameAndLastname,
  makeRouteAbsoluteUrl,
  type ReminderKind,
  splitCasesBetweenPassingAndFailing,
  type TemplatedEmail,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { AppConfigBuilder } from "../../../../utils/AppConfigBuilder";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationsBatchAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeNotifyConventionReminder,
  type NotifyConventionReminder,
} from "./NotifyConventionReminder";

describe("NotifyConventionReminder use case", () => {
  let useCase: NotifyConventionReminder;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let config: AppConfig;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    config = new AppConfigBuilder().build();
    timeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    useCase = makeNotifyConventionReminder({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        config,
        saveNotificationsBatchAndRelatedEvent:
          makeSaveNotificationsBatchAndRelatedEvent(
            new UuidV4Generator(),
            timeGateway,
          ),
      },
    });
  });

  describe("Wrong paths", () => {
    it("Missing convention", async () => {
      //Arrange
      const convention = new ConventionDtoBuilder().build();
      uow.conventionRepository.setConventions([]);

      //Act
      await expectPromiseToFailWithError(
        useCase.execute({
          conventionId: convention.id,
          reminderKind: "FirstReminderForAgency",
        }),
        errors.convention.notFound({ conventionId: convention.id }),
      );

      //Assert
      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });

    it("Missing agency", async () => {
      //Arrange
      const convention = new ConventionDtoBuilder().build();
      uow.conventionRepository.setConventions([convention]);

      //Act
      await expectPromiseToFailWithError(
        useCase.execute({
          conventionId: convention.id,
          reminderKind: "FirstReminderForAgency",
        }),
        errors.agency.notFound({ agencyId: convention.agencyId }),
      );

      //Assert
      expectSavedNotificationsAndEvents({
        emails: [],
      });
    });
  });

  describe("Agency reminders", () => {
    const [authorizedAgencyStatuses, forbiddenAgencyStatuses] =
      splitCasesBetweenPassingAndFailing(conventionStatuses, ["IN_REVIEW"]);

    const councellor1 = new ConnectedUserBuilder()
      .withId("counsellor1")
      .withEmail("councellor1@email.com")
      .buildUser();
    const councellor2 = new ConnectedUserBuilder()
      .withId("counsellor2")
      .withEmail("councellor2@email.com")
      .buildUser();
    const validator1 = new ConnectedUserBuilder()
      .withId("validator1")
      .withEmail("validator1@email.com")
      .buildUser();
    const validator2 = new ConnectedUserBuilder()
      .withId("validator2")
      .withEmail("validator2@email.com")
      .buildUser();
    const agencyWithRight = toAgencyWithRights(
      new AgencyDtoBuilder().withId("agencyId").build(),
      {
        [councellor1.id]: {
          isNotifiedByEmail: true,
          roles: ["counsellor"],
        },
        [councellor2.id]: {
          isNotifiedByEmail: true,
          roles: ["counsellor"],
        },
        [validator1.id]: {
          isNotifiedByEmail: true,
          roles: ["validator", "counsellor"],
        },
        [validator2.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      },
    );

    beforeEach(() => {
      uow.userRepository.users = [
        councellor1,
        councellor2,
        validator1,
        validator2,
      ];
      uow.agencyRepository.agencies = [agencyWithRight];
    });

    describe("FirstReminderForAgency", () => {
      it.each(authorizedAgencyStatuses)(
        `Send email 'FirstReminderForAgency' to counsellors and validators when status is '%s'`,
        async (status) => {
          //Arrange
          const convention = new ConventionDtoBuilder()
            .withAgencyId(agencyWithRight.id)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([convention]);

          //Act
          await useCase.execute({
            conventionId: convention.id,
            reminderKind: "FirstReminderForAgency",
          });

          //Assert

          const manageConventionLink = (email: string): AbsoluteUrl =>
            makeRouteAbsoluteUrl({
              route: frontRoutes.manageConventionConnectedUser({
                conventionId: convention.id,
                email,
              }),
              baseUrl: config.immersionFacileBaseUrl,
            });

          expectSavedNotificationsAndEvents({
            emails: [
              makeAgencyFirstReminderEmail({
                email: validator1.email,
                agency: agencyWithRight,
                convention,
                manageConventionLink: manageConventionLink(validator1.email),
              }),
              makeAgencyFirstReminderEmail({
                email: validator2.email,
                agency: agencyWithRight,
                convention,
                manageConventionLink: manageConventionLink(validator2.email),
              }),
              makeAgencyFirstReminderEmail({
                email: councellor1.email,
                agency: agencyWithRight,
                convention,
                manageConventionLink: manageConventionLink(councellor1.email),
              }),
              makeAgencyFirstReminderEmail({
                email: councellor2.email,
                agency: agencyWithRight,
                convention,
                manageConventionLink: manageConventionLink(councellor2.email),
              }),
            ],
          });
        },
      );

      describe("Forbidden cases on convention bad status", () => {
        it.each(forbiddenAgencyStatuses)("status '%s'", async (status) => {
          //Arrange
          const convention = new ConventionDtoBuilder()
            .withAgencyId(agencyWithRight.id)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const kind: ReminderKind = "FirstReminderForAgency";

          //Act & Assert
          await expectPromiseToFailWithError(
            useCase.execute({
              conventionId: convention.id,
              reminderKind: kind,
            }),
            errors.convention.forbiddenReminder({ convention, kind }),
          );
          expectSavedNotificationsAndEvents({
            emails: [],
          });
        });
      });
    });

    describe("LastReminderForAgency", () => {
      it.each(authorizedAgencyStatuses)(
        "Send email 'LastReminderForAgency' to counsellors and validators when status is '%s'",
        async (status) => {
          //Arrange
          const convention = new ConventionDtoBuilder()
            .withAgencyId(agencyWithRight.id)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([convention]);

          //Act
          await useCase.execute({
            conventionId: convention.id,
            reminderKind: "LastReminderForAgency",
          });

          //Assert

          const manageConventionLink = (email: string): AbsoluteUrl =>
            makeRouteAbsoluteUrl({
              route: frontRoutes.manageConventionConnectedUser({
                conventionId: convention.id,
                email,
              }),
              baseUrl: config.immersionFacileBaseUrl,
            });

          expectSavedNotificationsAndEvents({
            emails: [
              makeAgencyLastReminderEmail({
                email: validator1.email,
                convention,
                manageConventionLink: manageConventionLink(validator1.email),
              }),
              makeAgencyLastReminderEmail({
                email: validator2.email,
                convention,
                manageConventionLink: manageConventionLink(validator2.email),
              }),
              makeAgencyLastReminderEmail({
                email: councellor1.email,
                convention,
                manageConventionLink: manageConventionLink(councellor1.email),
              }),
              makeAgencyLastReminderEmail({
                email: councellor2.email,
                convention,
                manageConventionLink: manageConventionLink(councellor2.email),
              }),
            ],
          });
        },
      );

      describe("Forbidden cases on convention bad status", () => {
        it.each(forbiddenAgencyStatuses)("status '%s'", async (status) => {
          //Arrange
          const convention = new ConventionDtoBuilder()
            .withAgencyId(agencyWithRight.id)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([convention]);

          const kind: ReminderKind = "FirstReminderForAgency";
          //Act
          await expectPromiseToFailWithError(
            useCase.execute({
              conventionId: convention.id,
              reminderKind: kind,
            }),
            errors.convention.forbiddenReminder({ convention, kind }),
          );

          //Assert
          expectSavedNotificationsAndEvents({
            emails: [],
          });
        });
      });
    });
  });
});

const makeAgencyFirstReminderEmail = ({
  email,
  agency,
  convention,
  manageConventionLink,
}: {
  email: string;
  agency: AgencyWithUsersRights;
  convention: ConventionDto;
  manageConventionLink: AbsoluteUrl;
}): TemplatedEmail => ({
  kind: "AGENCY_FIRST_REMINDER",
  recipients: [email],
  params: {
    agencyReferentName: getFormattedFirstnameAndLastname(
      convention.agencyReferent ?? {},
    ),
    conventionId: convention.id,
    agencyName: agency.name,
    beneficiaryFirstName: getFormattedFirstnameAndLastname({
      firstname: convention.signatories.beneficiary.firstName,
    }),
    beneficiaryLastName: getFormattedFirstnameAndLastname({
      lastname: convention.signatories.beneficiary.lastName,
    }),
    businessName: getDisplayedBusinessName(convention),
    dateStart: convention.dateStart,
    dateEnd: convention.dateEnd,
    manageConventionLink,
  },
});

const makeAgencyLastReminderEmail = ({
  email,
  convention,
  manageConventionLink,
}: {
  email: string;
  convention: ConventionDto;
  manageConventionLink: AbsoluteUrl;
}): TemplatedEmail => ({
  kind: "AGENCY_LAST_REMINDER",
  recipients: [email],
  params: {
    conventionId: convention.id,
    agencyReferentName: getFormattedFirstnameAndLastname(
      convention.agencyReferent ?? {},
    ),
    beneficiaryFirstName: getFormattedFirstnameAndLastname({
      firstname: convention.signatories.beneficiary.firstName,
    }),
    beneficiaryLastName: getFormattedFirstnameAndLastname({
      lastname: convention.signatories.beneficiary.lastName,
    }),
    businessName: getDisplayedBusinessName(convention),
    manageConventionLink,
  },
});
