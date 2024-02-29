import {
  EstablishmentJwtPayload,
  expectPromiseToFailWithError,
  immersionFacileNoReplyEmailSender,
} from "shared";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
} from "../../../adapters/secondary/offer/EstablishmentBuilders";
import {
  ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationsAndEvents";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateRepository } from "../ports/EstablishmentAggregateRepository";
import { SuggestEditEstablishment } from "./SuggestEditEstablishment";

const siret = "12345678912345";
const contactEmail = "jerome@gmail.com";
const copyEmails = ["copy@gmail.com"];
const setMethodGetContactEmailFromSiret = (
  establishmentAggregateRepository: EstablishmentAggregateRepository,
) => {
  establishmentAggregateRepository.getEstablishmentAggregateBySiret =
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
        .build();
};

describe("SuggestEditEstablishment", () => {
  let suggestEditEstablishment: SuggestEditEstablishment;
  let uow: InMemoryUnitOfWork;
  let expectSavedNotificationsAndEvents: ExpectSavedNotificationsAndEvents;

  beforeEach(() => {
    uow = createInMemoryUow();
    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );
    setMethodGetContactEmailFromSiret(uow.establishmentAggregateRepository); // In most of the tests, we need the contact to be defined

    const timeGateway = new CustomTimeGateway();
    const uuidGenerator = new UuidV4Generator();
    const saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      uuidGenerator,
      timeGateway,
    );

    const uowPerformer = new InMemoryUowPerformer(uow);

    const generateEditFormEstablishmentUrl = (
      payload: EstablishmentJwtPayload,
    ) => `www.immersion-facile.fr/edit?jwt=jwtOfSiret[${payload.siret}]`;

    suggestEditEstablishment = new SuggestEditEstablishment(
      uowPerformer,
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
      suggestEditEstablishment.execute(siret),
      Error("Email du contact introuvable, pour le siret : 12345678912345"),
    );
  });

  it("Sends an email to contact and people in copy", async () => {
    // Act
    await suggestEditEstablishment.execute(siret);

    // Assert
    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
          recipients: [contactEmail],
          sender: immersionFacileNoReplyEmailSender,
          cc: copyEmails,
          params: {
            editFrontUrl:
              "www.immersion-facile.fr/edit?jwt=jwtOfSiret[12345678912345]",
            businessAddresses: ["24 rue des bouchers 67000 Strasbourg"],
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
      ],
    });
  });
});
