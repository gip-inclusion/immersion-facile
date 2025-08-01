import { expectArraysToEqual } from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { InMemoryPassEmploiGateway } from "../../adapters/pass-emploi/InMemoryPassEmploiGateway";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../../helpers/EstablishmentBuilders";
import type { PassEmploiNotificationParams } from "../../ports/PassEmploiGateway";
import { NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm } from "./NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm";

describe("Notify pass-emploi", () => {
  let uow: InMemoryUnitOfWork;
  let passEmploiGateway: InMemoryPassEmploiGateway;
  let useCase: NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm;

  beforeEach(() => {
    uow = createInMemoryUow();
    passEmploiGateway = new InMemoryPassEmploiGateway();
    useCase = new NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm(
      new InMemoryUowPerformer(uow),
      passEmploiGateway,
    );
  });
  it("Calls pass-emploi API with formatted immersion offers from just inserted aggregate", async () => {
    // Act
    const siret = "12345678901234";
    const position = { lon: 1, lat: 1 };
    const newAggregate = new EstablishmentAggregateBuilder()
      .withEstablishment(
        new EstablishmentEntityBuilder()
          .withSiret(siret)
          .withLocations([
            {
              position,
              address: {
                streetNumberAndAddress: "24 rue des bouchers",
                city: "Strasbourg",
                postcode: "67000",
                departmentCode: "67",
              },
              id: "1",
            },
          ])
          .build(),
      )
      .withOffers([
        new OfferEntityBuilder().withRomeCode("A1111").build(),
        new OfferEntityBuilder().withRomeCode("B1111").build(),
      ])
      .withUserRights([
        {
          role: "establishment-admin",
          job: "",
          phone: "",
          userId: "osef",
          shouldReceiveDiscussionNotifications: true,
          isMainContactByPhone: false,
        },
      ])
      .build();

    uow.establishmentAggregateRepository.establishmentAggregates = [
      newAggregate,
    ];

    await useCase.execute({ siret: newAggregate.establishment.siret });

    // Assert
    const expectedNotifications: PassEmploiNotificationParams[] = [
      {
        immersions: [
          { siret, location: position, rome: "A1111" },
          { siret, location: position, rome: "B1111" },
        ],
      },
    ];
    expectArraysToEqual(passEmploiGateway.notifications, expectedNotifications);
  });
});
