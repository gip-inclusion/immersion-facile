import { immersionFacileNoReplyEmailSender, UserBuilder } from "shared";
import { v4 as uuid } from "uuid";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { SuggestEstablishmentReengagement } from "./SuggestEstablishmentReengagement";

describe("SuggestEditEstablishment", () => {
  let suggestEstablishmentReengagement: SuggestEstablishmentReengagement;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    suggestEstablishmentReengagement = new SuggestEstablishmentReengagement(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
    );
  });

  it("Sends an email to each establishment admin with specific jwt", async () => {
    const admin1 = new UserBuilder()
      .withId(uuid())
      .withEmail("jerome@gmail.com")
      .build();
    const admin2 = new UserBuilder()
      .withId(uuid())
      .withEmail("billy@gmail.com")
      .build();
    const contact = new UserBuilder()
      .withId(uuid())
      .withEmail("copy@gmail.com")
      .build();

    const siret = "12345678912345";

    const establishmentAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret(siret)
          .withName("SAS FRANCE MERGUEZ DISTRIBUTION")
          .withLocations([
            {
              address: {
                streetNumberAndAddress: "24 rue des bouchers",
                city: "Strasbourg",
                postcode: "67000",
                departmentCode: "67",
              },
              position: {
                lat: 48.584614,
                lon: 7.750712,
              },
              id: "11111111-1111-4444-1111-111111111111",
            },
          ])
          .build(),
      )
      .withUserRights([
        {
          userId: admin1.id,
          role: "establishment-admin",
          status: "ACCEPTED",
          job: "Boss1",
          phone: "+33688779955",
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
        },
        {
          userId: admin2.id,
          role: "establishment-admin",
          status: "ACCEPTED",
          job: "Boss2",
          phone: "+33688779666",
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
        },
        {
          userId: contact.id,
          status: "ACCEPTED",
          role: "establishment-contact",
          shouldReceiveDiscussionNotifications: true,
        },
      ])
      .build();

    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];
    uow.userRepository.users = [admin1, admin2, contact];

    await suggestEstablishmentReengagement.execute(
      establishmentAggregate.establishment.siret,
    );

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "ESTABLISHMENT_REENGAGEMENT_SUGGESTION",
          recipients: [admin1.email],
          sender: immersionFacileNoReplyEmailSender,
          params: {
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
        {
          kind: "ESTABLISHMENT_REENGAGEMENT_SUGGESTION",
          recipients: [admin2.email],
          sender: immersionFacileNoReplyEmailSender,
          params: {
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
      ],
    });
  });
});
