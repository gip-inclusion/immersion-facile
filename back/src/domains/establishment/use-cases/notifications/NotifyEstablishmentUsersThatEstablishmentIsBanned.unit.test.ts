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
    uow.userRepository.users = [adminUser, contactUser];
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
      ];
    });

    it("sends emails to admin and contact users", async () => {
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

    it("sends only admin emails when establishment has no contacts", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        {
          ...bannedEstablishmentAggregate,
          userRights: [
            {
              role: "establishment-admin" as const,
              userId: adminUser.id,
              status: "ACCEPTED" as const,
              shouldReceiveDiscussionNotifications: true,
              isMainContactByPhone: false,
              job: "CEO",
              phone: "0600000000",
            },
          ],
        },
      ];

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
        ],
      });
    });
  });
});
