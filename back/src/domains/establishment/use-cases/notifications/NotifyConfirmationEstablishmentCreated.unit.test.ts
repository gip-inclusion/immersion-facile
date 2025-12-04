import { ConnectedUserBuilder } from "shared";
import { locationToRawAddress } from "../../../../utils/address";
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
import { EstablishmentAggregateBuilder } from "../../helpers/EstablishmentBuilders";
import { NotifyConfirmationEstablishmentCreated } from "./NotifyConfirmationEstablishmentCreated";

describe("NotifyConfirmationEstablishmentCreated", () => {
  let notifyConfirmationEstablishmentCreated: NotifyConfirmationEstablishmentCreated;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const uuidGenerator = new UuidV4Generator();
    const timeGateway = new CustomTimeGateway();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    notifyConfirmationEstablishmentCreated =
      new NotifyConfirmationEstablishmentCreated(
        uowPerformer,
        saveNotificationAndRelatedEvent,
      );
  });

  describe("When establishment is valid", () => {
    it("Nominal case: Sends notification email to Establisment contact", async () => {
      const establishmentAdmin = new ConnectedUserBuilder()
        .withId("admin")
        .withEmail("admin@estab.com")
        .buildUser();
      const establishmentContact1 = new ConnectedUserBuilder()
        .withId("contact1")
        .withEmail("contact1@estab.com")
        .buildUser();
      const establishmentContact2 = new ConnectedUserBuilder()
        .withId("contact2")
        .withEmail("contact2@estab.com")
        .buildUser();

      const establishmentAggregate = new EstablishmentAggregateBuilder()
        .withUserRights([
          {
            role: "establishment-admin",
            job: "Boss",
            phone: "+3366887744",
            userId: establishmentAdmin.id,
            shouldReceiveDiscussionNotifications: true,
            isMainContactByPhone: false,
          },
          {
            role: "establishment-contact",
            userId: establishmentContact1.id,
            shouldReceiveDiscussionNotifications: true,
          },
          {
            role: "establishment-contact",
            userId: establishmentContact2.id,
            shouldReceiveDiscussionNotifications: true,
          },
        ])
        .build();

      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];
      uow.userRepository.users = [
        establishmentAdmin,
        establishmentContact1,
        establishmentContact2,
      ];

      await notifyConfirmationEstablishmentCreated.execute({
        siret: establishmentAggregate.establishment.siret,
      });

      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION",
            recipients: [establishmentAdmin.email],
            cc: [establishmentContact1.email, establishmentContact2.email],
            params: {
              businessName: establishmentAggregate.establishment.name,
              businessAddresses:
                establishmentAggregate.establishment.locations.map(
                  ({ id, address }) =>
                    locationToRawAddress(id, address).rawAddress,
                ),
              appelationLabels: establishmentAggregate.offers.map(
                (offer) => offer.appellationLabel,
              ),
            },
          },
        ],
      });
    });
  });
});
