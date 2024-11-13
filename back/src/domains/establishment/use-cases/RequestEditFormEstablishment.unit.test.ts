import { addHours, addSeconds } from "date-fns";
import {
  EstablishmentJwtPayload,
  SiretDto,
  TemplatedEmail,
  UserBuilder,
} from "shared";
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
import { RequestEditFormEstablishment } from "./RequestEditFormEstablishment";

describe("RequestUpdateFormEstablishment", () => {
  let requestEditFormEstablishment: RequestEditFormEstablishment;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  const makeFakeEditEstablishmentUrl = (siret: SiretDto) =>
    `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${siret}]`;

  const establishmentAdmin = new UserBuilder()
    .withId("admin")
    .withEmail("admin@mail.com")
    .build();
  const establishmentContact = new UserBuilder()
    .withId("contact")
    .withEmail("contact@mail.com")
    .build();

  const establishmentAggregate = new EstablishmentAggregateBuilder()
    .withUserRights([
      {
        role: "establishment-admin",
        job: "Boos",
        phone: "+33655887744",
        userId: establishmentAdmin.id,
      },
      {
        role: "establishment-contact",
        userId: establishmentContact.id,
      },
    ])
    .withEstablishment(
      new EstablishmentEntityBuilder()
        .withSiret("34493368400021")
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
            id: "1",
          },
        ])
        .build(),
    )
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    timeGateway = new CustomTimeGateway();

    const generateEditFormEstablishmentUrl = (
      payload: EstablishmentJwtPayload,
    ) => makeFakeEditEstablishmentUrl(payload.siret);

    requestEditFormEstablishment = new RequestEditFormEstablishment(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
      timeGateway,
      generateEditFormEstablishmentUrl,
    );
  });

  describe("If no email has been sent yet.", () => {
    it("Sends an email to the contact of the establishment with eventually email in CC", async () => {
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];
      uow.userRepository.users = [establishmentAdmin, establishmentContact];

      await requestEditFormEstablishment.execute(
        establishmentAggregate.establishment.siret,
      );

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "EDIT_FORM_ESTABLISHMENT_LINK",
            recipients: [establishmentAdmin.email],
            cc: [establishmentContact.email],
            params: {
              editFrontUrl: makeFakeEditEstablishmentUrl(
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

  describe("if email has been sent", () => {
    it("should resend a request establishment link successfully", async () => {
      const initialMailDate = new Date("2021-01-01T13:00:00.000");

      uow.notificationRepository.notifications = [
        {
          kind: "email",
          id: "111111111111-1111-4000-1111-111111111111",
          createdAt: initialMailDate.toISOString(),
          followedIds: {},
          templatedContent: {
            kind: "EDIT_FORM_ESTABLISHMENT_LINK",
            recipients: [establishmentAdmin.email],
            params: {
              editFrontUrl: "my-edit-link.com",
              businessAddresses: ["24 rue des bouchers 67000 Strasbourg"],
              businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
            },
          },
        },
      ];
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];
      uow.userRepository.users = [establishmentAdmin, establishmentContact];

      const newModificationAskedDateLessThan24hAfterInitial = addHours(
        initialMailDate,
        23,
      );

      timeGateway.setNextDate(newModificationAskedDateLessThan24hAfterInitial);

      const response = await requestEditFormEstablishment.execute(
        establishmentAggregate.establishment.siret,
      );

      // Act and assert
      expect(() => response).not.toThrow();
    });

    it("Sends a new email if the edit link in last email has expired", async () => {
      // Prepare
      const initialMailDate = new Date("2021-01-01T13:00:00.000");

      const alreadySentEmail: TemplatedEmail = {
        kind: "EDIT_FORM_ESTABLISHMENT_LINK",
        recipients: [establishmentAdmin.email],
        params: {
          editFrontUrl: "my-edit-link.com",
          businessAddresses: ["24 rue des bouchers 67000 Strasbourg"],
          businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
        },
      };

      const alreadySentNotification = {
        kind: "email",
        id: "111111111111-1111-4000-1111-111111111111",
        createdAt: initialMailDate.toISOString(),
        followedIds: {},
        templatedContent: alreadySentEmail,
      };

      uow.notificationRepository.notifications = [
        {
          kind: "email",
          id: "111111111111-1111-4000-1111-111111111111",
          createdAt: initialMailDate.toISOString(),
          followedIds: {},
          templatedContent: alreadySentEmail,
        },
      ];
      uow.userRepository.users = [establishmentAdmin, establishmentContact];

      await uow.outboxRepository.save({
        id: "123",
        topic: "NotificationAdded",
        occurredAt: initialMailDate.toISOString(),
        status: "published",
        publications: [
          {
            publishedAt: addSeconds(initialMailDate, 1).toISOString(),
            failures: [],
          },
        ],
        payload: { id: alreadySentNotification.id, kind: "email" },
        wasQuarantined: false,
      });
      uow.establishmentAggregateRepository.establishmentAggregates = [
        establishmentAggregate,
      ];

      const newModificationAskedDateMoreThan24hAfterInitial = addHours(
        initialMailDate,
        25,
      );

      timeGateway.setNextDate(newModificationAskedDateMoreThan24hAfterInitial);

      // Act
      await requestEditFormEstablishment.execute(
        establishmentAggregate.establishment.siret,
      );

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          alreadySentEmail,
          {
            kind: "EDIT_FORM_ESTABLISHMENT_LINK",
            recipients: [establishmentAdmin.email],
            cc: [establishmentContact.email],
            params: {
              editFrontUrl: makeFakeEditEstablishmentUrl(
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
});
