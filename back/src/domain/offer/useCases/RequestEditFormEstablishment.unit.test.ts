import { addHours, addSeconds } from "date-fns";
import {
  EstablishmentJwtPayload,
  expectPromiseToFailWithError,
  TemplatedEmail,
} from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../_testBuilders/makeExpectSavedNotificationsAndEvents";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { UuidV4Generator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeSaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";
import { RequestEditFormEstablishment } from "./RequestEditFormEstablishment";

const siret = "12345678912345";
const contactEmail = "jerome@gmail.com";
const copyEmails = ["copy@gmail.com"];

const setMethodGetContactEmailFromSiret = (
  establishmentAggregateRepo: EstablishmentAggregateRepository,
) => {
  establishmentAggregateRepo.getEstablishmentAggregateBySiret =
    //eslint-disable-next-line @typescript-eslint/require-await
    async (_siret: string) =>
      new EstablishmentAggregateBuilder()
        .withContact(
          new ContactEntityBuilder()
            .withEmail(contactEmail)
            .withCopyEmails(copyEmails)
            .build(),
        )
        .withEstablishment(
          new EstablishmentEntityBuilder()
            .withSiret("34493368400021")
            .withName("SAS FRANCE MERGUEZ DISTRIBUTION")
            .withAddress({
              streetNumberAndAddress: "24 rue des bouchers",
              city: "Strasbourg",
              postcode: "67000",
              departmentCode: "67",
            })
            .build(),
        )
        .build();
};

describe("RequestUpdateFormEstablishment", () => {
  let requestEditFormEstablishment: RequestEditFormEstablishment;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    const establishmentAggregateRepository =
      uow.establishmentAggregateRepository;

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    setMethodGetContactEmailFromSiret(establishmentAggregateRepository); // In most of the tests, we need the contact to be defined

    timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    const generateEditFormEstablishmentUrl = (
      payload: EstablishmentJwtPayload,
    ) => `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${payload.siret}]`;

    requestEditFormEstablishment = new RequestEditFormEstablishment(
      new InMemoryUowPerformer(uow),
      saveNotificationAndRelatedEvent,
      timeGateway,
      generateEditFormEstablishmentUrl,
    );
  });

  it("Throws an error if contact email is unknown", async () => {
    // Prepare
    uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret =
      //eslint-disable-next-line @typescript-eslint/require-await
      async (_siret: string) =>
        new EstablishmentAggregateBuilder().withoutContact().build();

    // Act and assert
    await expectPromiseToFailWithError(
      requestEditFormEstablishment.execute(siret),
      Error("Email du contact introuvable."),
    );
  });

  describe("If no email has been sent yet.", () => {
    it("Sends an email to the contact of the establishment with eventually email in CC", async () => {
      // Act
      await requestEditFormEstablishment.execute(siret);

      // Assert
      expectSavedNotificationsAndEvents({
        emails: [
          {
            kind: "EDIT_FORM_ESTABLISHMENT_LINK",
            recipients: [contactEmail],
            cc: copyEmails,
            params: {
              editFrontUrl: `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${siret}]`,
              businessAddress: "24 rue des bouchers 67000 Strasbourg",
              businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
            },
          },
        ],
      });
    });
  });

  describe("If an email has already been sent for this establishment.", () => {
    it("Throws an error if an email has already been sent to this contact less than 24h ago", async () => {
      // Prepare
      const initialMailDate = new Date("2021-01-01T13:00:00.000");

      uow.notificationRepository.notifications = [
        {
          kind: "email",
          id: "111111111111-1111-4000-1111-111111111111",
          createdAt: initialMailDate.toISOString(),
          followedIds: {},
          templatedContent: {
            kind: "EDIT_FORM_ESTABLISHMENT_LINK",
            recipients: [contactEmail],
            params: {
              editFrontUrl: "my-edit-link.com",
              businessAddress: "24 rue des bouchers 67000 Strasbourg",
              businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
            },
          },
        },
      ];

      const newModificationAskedDateLessThan24hAfterInitial = addHours(
        initialMailDate,
        23,
      );

      timeGateway.setNextDate(newModificationAskedDateLessThan24hAfterInitial);

      // Act and assert
      await expectPromiseToFailWithError(
        requestEditFormEstablishment.execute(siret),
        new BadRequestError(
          "Un email a déjà été envoyé au contact référent de l'établissement le 01/01/2021",
        ),
      );
    });
  });

  it("Sends a new email if the edit link in last email has expired", async () => {
    // Prepare
    const initialMailDate = new Date("2021-01-01T13:00:00.000");

    const alreadySentEmail: TemplatedEmail = {
      kind: "EDIT_FORM_ESTABLISHMENT_LINK",
      recipients: [contactEmail],
      params: {
        editFrontUrl: "my-edit-link.com",
        businessAddress: "24 rue des bouchers 67000 Strasbourg",
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

    const newModificationAskedDateMoreThan24hAfterInitial = addHours(
      initialMailDate,
      25,
    );

    timeGateway.setNextDate(newModificationAskedDateMoreThan24hAfterInitial);

    // Act
    await requestEditFormEstablishment.execute(siret);

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [
        alreadySentEmail,
        {
          kind: "EDIT_FORM_ESTABLISHMENT_LINK",
          recipients: ["jerome@gmail.com"],
          cc: ["copy@gmail.com"],
          params: {
            editFrontUrl:
              "www.immersion-facile.fr/edit?jwt=jwtOfSiret[12345678912345]",
            businessAddress: "24 rue des bouchers 67000 Strasbourg",
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
      ],
    });
  });
});
