import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeNotifyDelegationConventionReminder,
  type NotifyDelegationConventionReminder,
} from "./NotifyDelegationConventionReminder";

describe("NotifyDelegationConventionReminder", () => {
  const delegationEndDate = new Date("2026-06-30").toISOString();
  const delegationAgencyName = "DR France Travail";
  const delegationAgencyKind = "pole-emploi" as const;
  const counsellor = new ConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@example.com")
    .buildUser();
  const toReviewUser = new ConnectedUserBuilder()
    .withId("toReviewUser")
    .withEmail("toreview@example.com")
    .buildUser();
  const readOnlyUser = new ConnectedUserBuilder()
    .withId("readOnlyUser")
    .withEmail("readonly@example.com")
    .buildUser();

  const agency = new AgencyDtoBuilder()
    .withKind("autre")
    .withStatus("active")
    .withAgencyContactEmail("contact@example.com")
    .withDelegationAgencyInfo({
      delegationEndDate,
      delegationAgencyName,
      delegationAgencyKind,
    })
    .build();

  let useCase: NotifyDelegationConventionReminder;
  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
    useCase = makeNotifyDelegationConventionReminder({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
          uuidGenerator,
          new CustomTimeGateway(),
        ),
      },
    });
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
  });

  describe("right path", () => {
    beforeEach(() => {
      uuidGenerator.setNextUuids([
        "notification-1",
        "event-1",
        "notification-2",
        "event-2",
        "notification-3",
        "event-3",
        "notification-4",
        "event-4",
      ]);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
          [toReviewUser.id]: {
            isNotifiedByEmail: false,
            roles: ["to-review"],
          },
          [readOnlyUser.id]: {
            isNotifiedByEmail: false,
            roles: ["agency-viewer"],
          },
        }),
      ];
      uow.userRepository.users = [counsellor, toReviewUser, readOnlyUser];
    });

    it("sends notification to contactEmail and validated users except to-review", async () => {
      await useCase.execute({
        agencyId: agency.id,
        reminderKind: "threeMonthsBefore",
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "DELEGATION_CONVENTION_EXPIRING_SOON",
            params: {
              agencyName: agency.name,
              delegationEndDate,
              delegationAgencyName,
              reminderKind: "threeMonthsBefore",
            },
            recipients: [
              agency.contactEmail,
              counsellor.email,
              readOnlyUser.email,
            ],
          },
        ],
      });
    });

    it("includes users with isNotifiedByEmail false", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [counsellor.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        }),
      ];
      uow.userRepository.users = [counsellor];

      await useCase.execute({
        agencyId: agency.id,
        reminderKind: "threeMonthsBefore",
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "DELEGATION_CONVENTION_EXPIRING_SOON",
            params: {
              agencyName: agency.name,
              delegationEndDate,
              delegationAgencyName,
              reminderKind: "threeMonthsBefore",
            },
            recipients: [agency.contactEmail, counsellor.email],
          },
        ],
      });
    });

    it("does not send notification when email was already sent for agency and type", async () => {
      await useCase.execute({
        agencyId: agency.id,
        reminderKind: "threeMonthsBefore",
      });

      await useCase.execute({
        agencyId: agency.id,
        reminderKind: "threeMonthsBefore",
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "DELEGATION_CONVENTION_EXPIRING_SOON",
            params: {
              agencyName: agency.name,
              delegationEndDate,
              delegationAgencyName,
              reminderKind: "threeMonthsBefore",
            },
            recipients: [
              agency.contactEmail,
              counsellor.email,
              readOnlyUser.email,
            ],
          },
        ],
      });
    });

    it("sends DELEGATION_CONVENTION_EXPIRED notification when reminderKind is dayAfterExpiry", async () => {
      await useCase.execute({
        agencyId: agency.id,
        reminderKind: "dayAfterExpiry",
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "DELEGATION_CONVENTION_EXPIRED",
            params: {
              agencyName: agency.name,
              delegationAgencyName,
              delegationAgencyKind,
            },
            recipients: [
              agency.contactEmail,
              counsellor.email,
              readOnlyUser.email,
            ],
          },
        ],
      });
    });

    it("does not send DELEGATION_CONVENTION_EXPIRED notification when email was already sent", async () => {
      await useCase.execute({
        agencyId: agency.id,
        reminderKind: "dayAfterExpiry",
      });

      await useCase.execute({
        agencyId: agency.id,
        reminderKind: "dayAfterExpiry",
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "DELEGATION_CONVENTION_EXPIRED",
            params: {
              agencyName: agency.name,
              delegationAgencyName,
              delegationAgencyKind,
            },
            recipients: [
              agency.contactEmail,
              counsellor.email,
              readOnlyUser.email,
            ],
          },
        ],
      });
    });

    it("allows M3 and M1 notifications for the same agency", async () => {
      await useCase.execute({
        agencyId: agency.id,
        reminderKind: "threeMonthsBefore",
      });
      await useCase.execute({
        agencyId: agency.id,
        reminderKind: "oneMonthBefore",
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "DELEGATION_CONVENTION_EXPIRING_SOON",
            params: {
              agencyName: agency.name,
              delegationEndDate,
              delegationAgencyName,
              reminderKind: "threeMonthsBefore",
            },
            recipients: [
              agency.contactEmail,
              counsellor.email,
              readOnlyUser.email,
            ],
          },
          {
            kind: "DELEGATION_CONVENTION_EXPIRING_SOON",
            params: {
              agencyName: agency.name,
              delegationEndDate,
              delegationAgencyName,
              reminderKind: "oneMonthBefore",
            },
            recipients: [
              agency.contactEmail,
              counsellor.email,
              readOnlyUser.email,
            ],
          },
        ],
      });
    });
  });

  describe("wrong path", () => {
    it("throws when agency is not eligible", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(
          new AgencyDtoBuilder()
            .withId(agency.id)
            .withKind("autre")
            .withStatus("closed")
            .withDelegationAgencyInfo({
              delegationEndDate,
              delegationAgencyName,
              delegationAgencyKind,
            })
            .build(),
          {},
        ),
      ];

      await expectPromiseToFailWithError(
        useCase.execute({
          agencyId: agency.id,
          reminderKind: "threeMonthsBefore",
        }),
        errors.agency.forbiddenDelegationConventionReminder({
          agencyId: agency.id,
        }),
      );

      expectSavedNotificationsAndEvents({ emails: [] });
    });

    it("throws when agency is not found", async () => {
      await expectPromiseToFailWithError(
        useCase.execute({
          agencyId: agency.id,
          reminderKind: "threeMonthsBefore",
        }),
        errors.agency.notFound({ agencyId: agency.id }),
      );
    });
  });
});
