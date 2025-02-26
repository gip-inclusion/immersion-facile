import {
  AbsoluteUrl,
  UserBuilder,
  createInclusionConnectJwtPayload,
  frontRoutes,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type ExpectSavedNotificationsAndEvents,
  makeExpectSavedNotificationsAndEvents,
} from "../../../utils/makeExpectSavedNotificationAndEvent.helpers";
import { GenerateInclusionConnectJwt } from "../../core/jwt";
import { makeSaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
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
  let timeGateway: CustomTimeGateway;

  const fakeBaseUrl: AbsoluteUrl = "https://if-base-url";

  const generateFakeInclusionConnectJwt: GenerateInclusionConnectJwt = ({
    userId,
    version,
    exp,
    iat,
  }) => `${userId}-${version}-${exp}-${iat}`;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();

    expectSavedNotificationsAndEvents = makeExpectSavedNotificationsAndEvents(
      uow.notificationRepository,
      uow.outboxRepository,
    );

    suggestEditEstablishment = new SuggestEditEstablishment(
      new InMemoryUowPerformer(uow),
      makeSaveNotificationAndRelatedEvent(new UuidV4Generator(), timeGateway),
      timeGateway,
      generateFakeInclusionConnectJwt,
      fakeBaseUrl,
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
          userId: admin1.id,
          role: "establishment-admin",
          job: "Boss1",
          phone: "+33688779955",
        },
        {
          userId: admin2.id,
          role: "establishment-admin",
          job: "Boss2",
          phone: "+33688779666",
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
    uow.userRepository.users = [admin1, admin2, contact];

    await suggestEditEstablishment.execute(
      establishmentAggregate.establishment.siret,
    );

    expectSavedNotificationsAndEvents({
      emails: [
        {
          kind: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
          recipients: [admin1.email],
          sender: immersionFacileNoReplyEmailSender,
          params: {
            editFrontUrl: `${fakeBaseUrl}/${
              frontRoutes.editFormEstablishmentRoute
            }?jwt=${generateFakeInclusionConnectJwt(
              createInclusionConnectJwtPayload({
                userId: admin1.id,
                now: timeGateway.now(),
                durationDays: 2,
              }),
            )}`,
            businessAddresses: ["24 rue des bouchers 67000 Strasbourg"],
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
        {
          kind: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
          recipients: [admin2.email],
          sender: immersionFacileNoReplyEmailSender,
          params: {
            editFrontUrl: `${fakeBaseUrl}/${
              frontRoutes.editFormEstablishmentRoute
            }?jwt=${generateFakeInclusionConnectJwt(
              createInclusionConnectJwtPayload({
                userId: admin2.id,
                now: timeGateway.now(),
                durationDays: 2,
              }),
            )}`,
            businessAddresses: ["24 rue des bouchers 67000 Strasbourg"],
            businessName: "SAS FRANCE MERGUEZ DISTRIBUTION",
          },
        },
      ],
    });
  });
});
