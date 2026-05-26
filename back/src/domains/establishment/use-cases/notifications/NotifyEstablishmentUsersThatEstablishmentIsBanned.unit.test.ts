import { errors, expectPromiseToFailWithError, UserBuilder } from "shared";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import {
  makeSaveNotificationAndRelatedEvent,
  type SaveNotificationAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../../helpers/EstablishmentBuilders";
import {
  makeNotifyEstablishmentUsersThatEstablishmentIsBanned,
  type NotifyEstablishmentUsersThatEstablishmentIsBanned,
} from "./NotifyEstablishmentUsersThatEstablishmentIsBanned";

describe("NotifyEstablishmentUsersThatEstablishmentIsBanned", () => {
  let uow: InMemoryUnitOfWork;
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let notifyEstablishmentUsersThatEstablishmentIsBanned: NotifyEstablishmentUsersThatEstablishmentIsBanned;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  const adminUser = new UserBuilder()
    .withId("admin-id")
    .withEmail("admin@company.com")
    .build();

  const contactUser = new UserBuilder()
    .withId("contact-id")
    .withEmail("contact@company.com")
    .build();

  const anotherContactUser = new UserBuilder()
    .withId("another-contact-id")
    .withEmail("another.contact@company.com")
    .build();

  const bannedEstablishmentAggregate = new EstablishmentAggregateBuilder()
    .withUserRights([
      {
        role: "establishment-admin",
        userId: adminUser.id,
        status: "ACCEPTED",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
        job: "CEO",
        phone: "0600000000",
      },
      {
        role: "establishment-contact",
        userId: contactUser.id,
        status: "ACCEPTED",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
        job: "HR",
        phone: "0600000001",
      },
      {
        role: "establishment-contact",
        userId: anotherContactUser.id,
        status: "PENDING",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
        job: "Manager",
        phone: "0600000002",
      },
    ])
    .withBannishmentInformations({
      isEstablishmentBanned: true,
      establishmentBannishmentJustification:
        "Ils font de la pêche à pied intensive",
    })
    .build();

  const bannedEstablishmentAggregate2 = new EstablishmentAggregateBuilder()
    .withEstablishmentSiret("22222222222222")
    .withUserRights([
      {
        role: "establishment-admin",
        userId: adminUser.id,
        status: "ACCEPTED",
        shouldReceiveDiscussionNotifications: true,
        isMainContactByPhone: false,
        job: "CEO",
        phone: "0600000000",
      },
    ])
    .withBannishmentInformations({
      isEstablishmentBanned: true,
      establishmentBannishmentJustification:
        "Ils font de la pêche à pied intensive",
    })
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      new UuidV4Generator(),
      new CustomTimeGateway(),
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    notifyEstablishmentUsersThatEstablishmentIsBanned =
      makeNotifyEstablishmentUsersThatEstablishmentIsBanned({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: { saveNotificationAndRelatedEvent },
      });
    uow.userRepository.users = [adminUser, contactUser, anotherContactUser];
  });

  describe("Wrong path", () => {
    it("throws when establishment is not found", async () => {
      await expectPromiseToFailWithError(
        notifyEstablishmentUsersThatEstablishmentIsBanned.execute({
          siret: "00000000000000",
        }),
        errors.establishment.notFound({ siret: "00000000000000" }),
      );
    });

    it("throws when establishment is not banned", async () => {
      const notBannedEstablishmentAggregate = new EstablishmentAggregateBuilder(
        bannedEstablishmentAggregate,
      )
        .withBannishmentInformations({
          isEstablishmentBanned: false,
        })
        .build();

      uow.establishmentAggregateRepository.establishmentAggregates = [
        notBannedEstablishmentAggregate,
      ];

      await expectPromiseToFailWithError(
        notifyEstablishmentUsersThatEstablishmentIsBanned.execute({
          siret: notBannedEstablishmentAggregate.establishment.siret,
        }),
        errors.establishment.establishmentNotBanned({
          siret: notBannedEstablishmentAggregate.establishment.siret,
        }),
      );
    });
  });

  describe("Right path", () => {
    beforeEach(() => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        bannedEstablishmentAggregate,
        bannedEstablishmentAggregate2,
      ];
    });

    it("sends emails to accepted admin and contact users of the correct banned establishment", async () => {
      await notifyEstablishmentUsersThatEstablishmentIsBanned.execute({
        siret: bannedEstablishmentAggregate.establishment.siret,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [adminUser.email],
            params: {
              businessName: bannedEstablishmentAggregate.establishment.name,
              siret: bannedEstablishmentAggregate.establishment.siret,
            },
          },
          {
            kind: "ESTABLISHMENT_BANNED_NOTIFICATION_TO_ESTABLISHMENT_USERS",
            recipients: [contactUser.email],
            params: {
              businessName: bannedEstablishmentAggregate.establishment.name,
              siret: bannedEstablishmentAggregate.establishment.siret,
            },
          },
        ],
      });
    });
  });
});
