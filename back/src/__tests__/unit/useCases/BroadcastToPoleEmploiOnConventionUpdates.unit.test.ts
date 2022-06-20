import { ConventionId } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { expectObjectsToMatch } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryPoleEmploiGateway } from "../../../adapters/secondary/InMemoryPoleEmploiGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeStubGetFeatureFlags } from "../../../adapters/secondary/makeStubGetFeatureFlags";
import { BroadcastToPoleEmploiOnConventionUpdates } from "../../../domain/convention/useCases/broadcast/BroadcastToPoleEmploiOnConventionUpdates";

const prepareUseCase = ({
  enablePeConventionBroadcast,
}: {
  enablePeConventionBroadcast: boolean;
}) => {
  const poleEmploiGateWay = new InMemoryPoleEmploiGateway();
  const uow = createInMemoryUow();
  uow.getFeatureFlags = makeStubGetFeatureFlags({
    enablePeConventionBroadcast,
  });
  const useCase = new BroadcastToPoleEmploiOnConventionUpdates(
    new InMemoryUowPerformer(uow),
    poleEmploiGateWay,
  );

  return { useCase, poleEmploiGateWay };
};

describe("Broadcasts events to pole-emploi", () => {
  it("Skips conventions without federated id", async () => {
    // Prepare
    const { useCase, poleEmploiGateWay } = prepareUseCase({
      enablePeConventionBroadcast: true,
    });

    // Act
    const convention = new ConventionDtoBuilder()
      .withoutFederatedIdentity()
      .build();

    await useCase.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(0);
  });

  it("doesn't send notification if feature flag is OFF", async () => {
    // Prepare
    const { useCase, poleEmploiGateWay } = prepareUseCase({
      enablePeConventionBroadcast: false,
    });

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
    expect(poleEmploiGateWay.notifications).toHaveLength(0);
  });

  it("Converts and sends conventions with federated id if featureFlag is ON", async () => {
    // Prepare
    const { useCase, poleEmploiGateWay } = prepareUseCase({
      enablePeConventionBroadcast: true,
    });

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
