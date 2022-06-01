import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryPassEmploiGateway } from "../../../adapters/secondary/immersionOffer/InMemoryPassEmploiGateway";
import { PassEmploiNotificationParams } from "../../../domain/immersionOffer/ports/PassEmploiGateway";
import { NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm } from "../../../domain/immersionOffer/useCases/notifications/NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { expectArraysToEqual } from "../../../_testBuilders/test.helpers";

const prepareUseCase = () => {
  const establishmentAggregateRepo =
    new InMemoryEstablishmentAggregateRepository();
  const clock = new CustomClock();
  const passEmploiGateway = new InMemoryPassEmploiGateway();
  const useCase =
    new NotifyPassEmploiOnNewEstablishmentAggregateInsertedFromForm(
      passEmploiGateway,
    );

  return { useCase, clock, passEmploiGateway, establishmentAggregateRepo };
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
        new EstablishmentEntityV2Builder()
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
