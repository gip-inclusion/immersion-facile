import { ConventionId } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { expectObjectsToMatch } from "../../../_testBuilders/test.helpers";
import { InMemoryPoleEmploiGateway } from "../../../adapters/secondary/InMemoryPoleEmploiGateway";
import { BroadcastToPoleEmploiOnConventionUpdates } from "../../../domain/convention/useCases/broadcast/BroadcastToPoleEmploiOnConventionUpdates";

const prepareUseCase = () => {
  const poleEmploiGateWay = new InMemoryPoleEmploiGateway();
  const useCase = new BroadcastToPoleEmploiOnConventionUpdates(
    poleEmploiGateWay,
  );

  return { useCase, poleEmploiGateWay };
};

describe("Broadcasts events to pole-emploi", () => {
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

    const peExternalId = "peExternalId";
    const immersionConventionId: ConventionId = "immersionConventionId";

    // Act
    const convention = new ConventionDtoBuilder()
      .withId(immersionConventionId)
      .withExternalId(peExternalId)
      .withFederatedIdentity("peConnect:some-id")
      .withDateStart("2021-05-13T10:00:00.000Z")
      .withDateEnd("2021-05-14T10:30:00.000Z") // Lasts 1 day and half an hour, ie. 24.5 hours
      .withImmersionObjective("Confirmer un projet professionnel")
      .build();

    await useCase.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
    expectObjectsToMatch(poleEmploiGateWay.notifications[0], {
      id: peExternalId,
      originalId: immersionConventionId,
      objectifDeImmersion: 2,
      dureeImmersion: "24.5",
      dateDebut: "2021-05-13T10:00:00.000Z",
      dateFin: "2021-05-14T10:30:00.000Z",
    });
  });
});
