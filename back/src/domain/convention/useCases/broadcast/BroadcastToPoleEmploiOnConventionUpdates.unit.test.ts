import { ConventionId } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { reasonableSchedule } from "shared/src/schedule/ScheduleUtils";
import { expectObjectsToMatch } from "../../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { InMemoryFeatureFlagRepository } from "../../../../adapters/secondary/InMemoryFeatureFlagRepository";
import { InMemoryPoleEmploiGateway } from "../../../../adapters/secondary/InMemoryPoleEmploiGateway";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { BroadcastToPoleEmploiOnConventionUpdates } from "./BroadcastToPoleEmploiOnConventionUpdates";

const prepareUseCase = ({
  enablePeConventionBroadcast,
}: {
  enablePeConventionBroadcast: boolean;
}) => {
  const poleEmploiGateWay = new InMemoryPoleEmploiGateway();
  const uow = createInMemoryUow();
  uow.featureFlagRepository = new InMemoryFeatureFlagRepository({
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

    const immersionConventionId: ConventionId = "immersionConventionId";

    // Act
    const convention = new ConventionDtoBuilder()
      .withId(immersionConventionId)
      .withExternalId("1")
      .withImmersionAppelation({
        appellationCode: "11111",
        appellationLabel: "some Appellation",
        romeCode: "A1111",
        romeLabel: "some Rome",
      })
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withFederatedIdentity("peConnect:some-id")
      .withDateStart("2021-05-12")
      .withDateEnd("2021-05-14T00:30:00.000Z") //
      .withSchedule(reasonableSchedule)
      .withImmersionObjective("Initier une démarche de recrutement")
      .build();

    await useCase.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
    expectObjectsToMatch(poleEmploiGateWay.notifications[0], {
      id: "00000000001",
      peConnectId: "some-id",
      originalId: immersionConventionId,
      objectifDeImmersion: 3,
      dureeImmersion: "21",
      dateDebut: "2021-05-12T00:00:00.000Z",
      dateFin: "2021-05-14T00:30:00.000Z",
      status: "DEMANDE_VALIDÉE",
      codeAppellation: "011111",
    });
  });
});
