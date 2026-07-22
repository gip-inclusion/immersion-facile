import {
  type AbsoluteUrl,
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
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeNotifyUserThatAgencyRegistrationRequestWasReceived,
  type NotifyUserThatAgencyRegistrationRequestWasReceived,
} from "./NotifyUserThatAgencyRegistrationRequestWasReceived";

describe("NotifyUserThatAgencyRegistrationRequestWasReceived", () => {
  const immersionBaseUrl: AbsoluteUrl = "https://immersion-base-url.com";

  const requestingUser = new ConnectedUserBuilder()
    .withId("requesting-user-id")
    .withEmail("requesting-user@mail.com")
    .withFirstName("Jean")
    .withLastName("Demandeur")
    .buildUser();

  const admin1 = new ConnectedUserBuilder()
    .withId("admin1-id")
    .withEmail("admin1@agency.fr")
    .buildUser();

  const admin2 = new ConnectedUserBuilder()
    .withId("admin2-id")
    .withEmail("admin2@agency.fr")
    .buildUser();

  const admin3 = new ConnectedUserBuilder()
    .withId("admin3-id")
    .withEmail("admin3@agency.fr")
    .buildUser();

  const agency1 = AgencyDtoBuilder.create("agency1-id")
    .withName("Agency 1")
    .build();

  const agency2 = AgencyDtoBuilder.create("agency2-id")
    .withName("Agency 2")
    .build();

  const agencyWithoutAdmin = AgencyDtoBuilder.create("agency-without-admin-id")
    .withName("Agency Without Admin")
    .build();

  let uow: InMemoryUnitOfWork;
  let notifyUserThatAgencyRegistrationRequestWasReceived: NotifyUserThatAgencyRegistrationRequestWasReceived;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    notifyUserThatAgencyRegistrationRequestWasReceived =
      makeNotifyUserThatAgencyRegistrationRequestWasReceived({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          saveNotificationAndRelatedEvent: makeSaveNotificationAndRelatedEvent(
            new UuidV4Generator(),
            new CustomTimeGateway(),
          ),
          immersionBaseUrl,
        },
      });
  });

  it("throws when user is not found", async () => {
    await expectPromiseToFailWithError(
      notifyUserThatAgencyRegistrationRequestWasReceived.execute({
        userId: requestingUser.id,
        agencyIds: [agency1.id],
      }),
      errors.user.notFound({ userId: requestingUser.id }),
    );
  });

  it("throws when agency is not found", async () => {
    uow.userRepository.users = [requestingUser];

    await expectPromiseToFailWithError(
      notifyUserThatAgencyRegistrationRequestWasReceived.execute({
        userId: requestingUser.id,
        agencyIds: [agency1.id],
      }),
      errors.agencies.notFound({
        missingAgencyIds: [agency1.id],
        presentAgencyIds: [],
      }),
    );
  });

  it("sends confirmation email for one agency with two admins", async () => {
    uow.userRepository.users = [requestingUser, admin1, admin2];
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency1, {
        [admin1.id]: {
          isNotifiedByEmail: true,
          roles: ["agency-admin"],
        },
        [admin2.id]: {
          isNotifiedByEmail: false,
          roles: ["agency-admin"],
        },
      }),
    ];

    await notifyUserThatAgencyRegistrationRequestWasReceived.execute({
      userId: requestingUser.id,
      agencyIds: [agency1.id],
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_REGISTRATION_REQUEST_CONFIRMATION",
          recipients: [requestingUser.email],
          params: {
            immersionBaseUrl,
            agencies: [
              {
                agencyName: agency1.name,
                adminEmails: [admin1.email, admin2.email],
              },
            ],
          },
        },
      ],
    });
  });

  it("sends confirmation email for multiple agencies with and without admins", async () => {
    uow.userRepository.users = [requestingUser, admin1, admin3];
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency1, {
        [admin1.id]: {
          isNotifiedByEmail: true,
          roles: ["agency-admin"],
        },
      }),
      toAgencyWithRights(agencyWithoutAdmin, {}),
      toAgencyWithRights(agency2, {
        [admin3.id]: {
          isNotifiedByEmail: true,
          roles: ["agency-admin"],
        },
      }),
    ];

    await notifyUserThatAgencyRegistrationRequestWasReceived.execute({
      userId: requestingUser.id,
      agencyIds: [agency1.id, agencyWithoutAdmin.id, agency2.id],
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_REGISTRATION_REQUEST_CONFIRMATION",
          recipients: [requestingUser.email],
          params: {
            immersionBaseUrl,
            agencies: [
              {
                agencyName: agency1.name,
                adminEmails: [admin1.email],
              },
              {
                agencyName: agencyWithoutAdmin.name,
                adminEmails: [],
              },
              {
                agencyName: agency2.name,
                adminEmails: [admin3.email],
              },
            ],
          },
        },
      ],
    });
  });

  it("sends confirmation email with empty adminEmails when agency has no admin", async () => {
    uow.userRepository.users = [requestingUser];
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agencyWithoutAdmin, {}),
    ];

    await notifyUserThatAgencyRegistrationRequestWasReceived.execute({
      userId: requestingUser.id,
      agencyIds: [agencyWithoutAdmin.id],
    });

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "AGENCY_REGISTRATION_REQUEST_CONFIRMATION",
          recipients: [requestingUser.email],
          params: {
            immersionBaseUrl,
            agencies: [
              {
                agencyName: agencyWithoutAdmin.name,
                adminEmails: [],
              },
            ],
          },
        },
      ],
    });
  });
});
