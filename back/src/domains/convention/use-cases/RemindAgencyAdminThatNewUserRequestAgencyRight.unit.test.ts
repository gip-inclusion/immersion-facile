import {
  type AbsoluteUrl,
  AgencyDtoBuilder,
  ConnectedUserBuilder,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  type ExpectSavedNotificationsBatchAndEvent,
  makeExpectSavedNotificationsBatchAndEvent,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationsBatchAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeRemindAgencyAdminThatNewUserRequestAgencyRight,
  type RemindAgencyAdminThatNewUserRequestAgencyRight,
} from "./RemindAgencyAdminThatNewUserRequestAgencyRight";

describe("RemindAgencyAdminThatNewUserRequestAgencyRight", () => {
  const admin1 = new ConnectedUserBuilder()
    .withId("admin1-id")
    .withEmail("admin1@agency1.fr")
    .withFirstName("Admin")
    .withLastName("One")
    .buildUser();

  const admin2 = new ConnectedUserBuilder()
    .withId("admin2-id")
    .withEmail("admin2@agency2.fr")
    .withFirstName("Admin")
    .withLastName("Two")
    .buildUser();

  const userToReview1 = new ConnectedUserBuilder()
    .withId("user-to-review-1")
    .withEmail("user1@mail.fr")
    .buildUser();

  const userToReview2 = new ConnectedUserBuilder()
    .withId("user-to-review-2")
    .withEmail("user2@mail.fr")
    .buildUser();

  const userToReview3 = new ConnectedUserBuilder()
    .withId("user-to-review-3")
    .withEmail("user3@mail.fr")
    .buildUser();

  const validator1 = new ConnectedUserBuilder()
    .withId("validator1-id")
    .withEmail("validator1@agency1.fr")
    .buildUser();

  const agency1 = AgencyDtoBuilder.create("agency1-id")
    .withName("Agency 1")
    .build();

  const agency2 = AgencyDtoBuilder.create("agency2-id")
    .withName("Agency 2")
    .build();

  const agency3 = AgencyDtoBuilder.create("agency3-id")
    .withName("Agency 3")
    .build();

  const immersionBaseUrl: AbsoluteUrl = "https://immersion-base-url.com";

  let uow: InMemoryUnitOfWork;
  let remindAgencyAdminThatNewUserRequestAgencyRight: RemindAgencyAdminThatNewUserRequestAgencyRight;
  let expectSavedNotificationsBatchAndEvent: ExpectSavedNotificationsBatchAndEvent;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsBatchAndEvent =
      makeExpectSavedNotificationsBatchAndEvent(
        uow.notificationRepository,
        uow.outboxRepository,
      );
    remindAgencyAdminThatNewUserRequestAgencyRight =
      makeRemindAgencyAdminThatNewUserRequestAgencyRight({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          saveNotificationsBatchAndRelatedEvent:
            makeSaveNotificationsBatchAndRelatedEvent(
              new UuidV4Generator(),
              new CustomTimeGateway(),
            ),
          immersionBaseUrl,
        },
      });
  });

  describe("When there are no agencies with users to review", () => {
    it("should not send any emails", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency1, {
          [admin1.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
        }),
      ];
      uow.userRepository.users = [admin1];

      await remindAgencyAdminThatNewUserRequestAgencyRight.execute();

      expectSavedNotificationsBatchAndEvent({
        emails: [],
      });
    });
  });

  describe("When there are agencies with users to review", () => {
    it("should send emails to admins with their agencies and user counts", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency1, {
          [admin1.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
          [validator1.id]: {
            isNotifiedByEmail: false,
            roles: ["validator"],
          },
          [userToReview1.id]: {
            isNotifiedByEmail: false,
            roles: ["to-review"],
          },
          [userToReview2.id]: {
            isNotifiedByEmail: false,
            roles: ["to-review"],
          },
        }),
        toAgencyWithRights(agency2, {
          [admin2.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
          [userToReview3.id]: {
            isNotifiedByEmail: false,
            roles: ["to-review"],
          },
        }),
        toAgencyWithRights(agency3, {
          [admin1.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
        }),
      ];

      uow.userRepository.users = [admin1, admin2, validator1];

      await remindAgencyAdminThatNewUserRequestAgencyRight.execute();

      expectSavedNotificationsBatchAndEvent({
        emails: [
          {
            kind: "AGENCY_ADMIN_NEW_USERS_TO_REVIEW_NOTIFICATION",
            recipients: [admin1.email],
            params: {
              firstName: admin1.firstName,
              lastName: admin1.lastName,
              immersionBaseUrl,
              agencies: [
                {
                  agencyName: agency1.name,
                  numberOfUsersToReview: 2,
                },
              ],
            },
          },
          {
            kind: "AGENCY_ADMIN_NEW_USERS_TO_REVIEW_NOTIFICATION",
            recipients: [admin2.email],
            params: {
              firstName: admin2.firstName,
              lastName: admin2.lastName,
              immersionBaseUrl,
              agencies: [
                {
                  agencyName: agency2.name,
                  numberOfUsersToReview: 1,
                },
              ],
            },
          },
        ],
      });
    });

    it("should send one email to admin who manages multiple agencies", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency1, {
          [admin1.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
          [userToReview1.id]: {
            isNotifiedByEmail: false,
            roles: ["to-review"],
          },
        }),
        toAgencyWithRights(agency2, {
          [admin1.id]: {
            isNotifiedByEmail: true,
            roles: ["agency-admin"],
          },
          [userToReview2.id]: {
            isNotifiedByEmail: false,
            roles: ["to-review"],
          },
          [userToReview3.id]: {
            isNotifiedByEmail: false,
            roles: ["to-review"],
          },
        }),
      ];

      uow.userRepository.users = [admin1];

      await remindAgencyAdminThatNewUserRequestAgencyRight.execute();

      expectSavedNotificationsBatchAndEvent({
        emails: [
          {
            kind: "AGENCY_ADMIN_NEW_USERS_TO_REVIEW_NOTIFICATION",
            recipients: [admin1.email],
            params: {
              firstName: admin1.firstName,
              lastName: admin1.lastName,
              immersionBaseUrl,
              agencies: [
                {
                  agencyName: agency1.name,
                  numberOfUsersToReview: 1,
                },
                {
                  agencyName: agency2.name,
                  numberOfUsersToReview: 2,
                },
              ],
            },
          },
        ],
      });
    });

    it("should not send emails when agencies have users to review but no admins", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency1, {
          [validator1.id]: {
            isNotifiedByEmail: false,
            roles: ["validator"],
          },
          [userToReview1.id]: {
            isNotifiedByEmail: false,
            roles: ["to-review"],
          },
        }),
      ];

      uow.userRepository.users = [validator1];

      await remindAgencyAdminThatNewUserRequestAgencyRight.execute();

      expectSavedNotificationsBatchAndEvent({
        emails: [],
      });
    });
  });
});
