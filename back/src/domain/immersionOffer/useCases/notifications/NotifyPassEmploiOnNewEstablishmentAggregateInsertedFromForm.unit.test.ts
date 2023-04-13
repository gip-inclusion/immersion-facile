import { expectArraysToEqual } from "shared";
import { EstablishmentAggregateBuilder } from "../../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { InMemoryPassEmploiGateway } from "../../../../adapters/secondary/immersionOffer/passEmploi/InMemoryPassEmploiGateway";
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
          .withPosition(position)
          .build(),
      )
      .withImmersionOffers([
        new ImmersionOfferEntityV2Builder().withRomeCode("A1111").build(),
        new ImmersionOfferEntityV2Builder().withRomeCode("B1111").build(),
      ])
      .build();

    await useCase.execute(newAggregate);

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
