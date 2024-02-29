import { expectArraysToEqual } from "shared";
import { createInMemoryUow } from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryPassEmploiGateway } from "../../adapters/pass-emploi/InMemoryPassEmploiGateway";
import {
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../../helpers/EstablishmentBuilders";
import { PassEmploiNotificationParams } from "../../ports/PassEmploiGateway";
import { NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm } from "./NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm";

const prepareUseCase = () => {
  const uow = createInMemoryUow();
  const establishmentAggregateRepository = uow.establishmentAggregateRepository;
  const passEmploiGateway = new InMemoryPassEmploiGateway();
  const useCase =
    new NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm(
      passEmploiGateway,
    );

  return {
    useCase,
    passEmploiGateway,
    establishmentAggregateRepository,
  };
};

describe("Notify pass-emploi", () => {
  it("Calls pass-emploi API with formatted immersion offers from just inserted aggregate", async () => {
    // Prepare
    const { useCase, passEmploiGateway } = prepareUseCase();

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
      .build();

    await useCase.execute({ establishmentAggregate: newAggregate });

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
