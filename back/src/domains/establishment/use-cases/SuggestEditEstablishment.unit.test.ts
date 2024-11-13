import {
  EstablishmentJwtPayload,
  SiretDto,
  UserBuilder,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { SuggestEditEstablishment } from "./SuggestEditEstablishment";

describe("SuggestEditEstablishment", () => {
  let suggestEditEstablishment: SuggestEditEstablishment;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  const makeFakeEditUrl = (siret: SiretDto) =>
    `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${siret}]`;

  beforeEach(() => {
    uow = createInMemoryUow();

    const generateEditFormEstablishmentUrl = (
      payload: EstablishmentJwtPayload,
    ) => makeFakeEditUrl(payload.siret);

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    const timeGateway = new CustomTimeGateway();
    suggestEditEstablishment = new SuggestEditEstablishment(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
      timeGateway,
      generateEditFormEstablishmentUrl,
    );
  });

  it("Sends an email to contact and people in copy", async () => {
    const admin = new UserBuilder()
      .withId(uuid())
      .withEmail("jerome@gmail.com")
      .build();
    const contact = new UserBuilder()
      .withId(uuid())
      .withEmail("copy@gmail.com")
      .build();

    const establishmentAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret("12345678912345")
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
          userId: admin.id,
          role: "establishment-admin",
          job: "Boss",
          phone: "+33688779955",
        },
        {
          userId: contact.id,
          role: "establishment-contact",
        },
      ])
      .build();

    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregate,
    ];
    uow.userRepository.users = [admin, contact];

    await suggestEditEstablishment.execute(
      establishmentAggregate.establishment.siret,
    );

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
          recipients: [admin.email],
          sender: immersionFacileNoReplyEmailSender,
          cc: [contact.email],
          params: {
            editFrontUrl: makeFakeEditUrl(
              establishmentAggregate.establishment.siret,
            ),
            businessAddresses: ["24 rue des bouchers 67000 Strasbourg"],
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
      ],
    });
  });
});
