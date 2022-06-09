import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { InMemoryPoleEmploiGateway } from "../../../adapters/secondary/InMemoryPoleEmploiGateway";
import { PoleEmploiConvention } from "../../../domain/convention/ports/PoleEmploiGateway";
import { NotifyPoleEmploiOnConventionUpdates } from "../../../domain/convention/useCases/notifications/NotifyPoleEmploiOnConventionUpdates";

const prepareUseCase = () => {
  const poleEmploiGateWay = new InMemoryPoleEmploiGateway();
  const useCase = new NotifyPoleEmploiOnConventionUpdates(poleEmploiGateWay);

  return { useCase, poleEmploiGateWay };
};
describe("Notify pole-emploi", () => {
  it("Skips conventions without federated id", async () => {
    // Prepare
    const { useCase, poleEmploiGateWay } = prepareUseCase();

    // Act
    const convention = new ConventionDtoBuilder()
      .withoutFederatedIdentity()
      .build();

    await useCase.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(0);
  });
  it("Converts and sends conventions with federated id", async () => {
    // Prepare
    const { useCase, poleEmploiGateWay } = prepareUseCase();

    // Act
    const convention = new ConventionDtoBuilder()
      .withFederatedIdentity("peConnect:some-id")
      .withDateStart("2021-05-13T10:00:00.000Z")
      .withDateEnd("2021-05-14T10:30:00.000Z") // Lasts 1 day and half an hour, ie. 24.5 hours
      .withImmersionObjective("Confirmer un projet professionnel")
      .build();

    await useCase.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
    const partialExpectedPoleEmploiConvention: Partial<PoleEmploiConvention> = {
      objectifDeImmersion: 2,
      dureeImmersion: 24.5,
      dateDebut: "2021-05-13T10:00:00.000Z",
      dateFin: "2021-05-14T10:30:00.000Z",
    };
    expect(poleEmploiGateWay.notifications[0]).toMatchObject(
      partialExpectedPoleEmploiConvention,
    );
  });
});
