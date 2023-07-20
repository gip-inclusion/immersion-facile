import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionId,
  expectObjectsToMatch,
  expectToEqual,
  makeBooleanFeatureFlag,
  reasonableSchedule,
} from "shared";
import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryFeatureFlagRepository } from "../../../../adapters/secondary/InMemoryFeatureFlagRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryPoleEmploiGateway } from "../../../../adapters/secondary/poleEmploi/InMemoryPoleEmploiGateway";
import { BroadcastToPoleEmploiOnConventionUpdates } from "./BroadcastToPoleEmploiOnConventionUpdates";

const prepareUseCase = async ({
  enablePeConventionBroadcastIsActive,
}: {
  enablePeConventionBroadcastIsActive: boolean;
}) => {
  const poleEmploiGateWay = new InMemoryPoleEmploiGateway();
  const uow = createInMemoryUow();
  uow.featureFlagRepository = new InMemoryFeatureFlagRepository({
    enablePeConventionBroadcast: makeBooleanFeatureFlag(
      enablePeConventionBroadcastIsActive,
    ),
  });
  const timeGateway = new CustomTimeGateway();
  const broadcastToPe = new BroadcastToPoleEmploiOnConventionUpdates(
    new InMemoryUowPerformer(uow),
    poleEmploiGateWay,
    timeGateway,
    { resyncMode: false },
  );

  const agencyRepository = uow.agencyRepository;
  const peAgency = new AgencyDtoBuilder()
    .withId("some-pe-agency")
    .withKind("pole-emploi")
    .build();
  await agencyRepository.setAgencies([peAgency]);

  return {
    broadcastToPe,
    poleEmploiGateWay,
    agencyRepository,
    peAgency,
    errorRepository: uow.errorRepository,
    timeGateway,
  };
};

describe("Broadcasts events to pole-emploi", () => {
  it("Skips convention if not linked to an agency of kind pole-emploi", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, agencyRepository } =
      await prepareUseCase({
        enablePeConventionBroadcastIsActive: true,
      });

    const agency = new AgencyDtoBuilder().withKind("mission-locale").build();
    await agencyRepository.setAgencies([agency]);

    // Act
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
      .build();

    await broadcastToPe.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(0);
  });

  it("Conventions without federated id are still sent", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, peAgency } = await prepareUseCase(
      {
        enablePeConventionBroadcastIsActive: true,
      },
    );

    // Act
    const convention = new ConventionDtoBuilder()
      .withAgencyId(peAgency.id)
      .withoutFederatedIdentity()
      .build();

    await broadcastToPe.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
  });

  it("If Pe returns a 404 error, we store the error in a repo", async () => {
    // Prepare
    const {
      broadcastToPe,
      poleEmploiGateWay,
      peAgency,
      errorRepository,
      timeGateway,
    } = await prepareUseCase({
      enablePeConventionBroadcastIsActive: true,
    });

    // Act
    const convention = new ConventionDtoBuilder()
      .withAgencyId(peAgency.id)
      .withoutFederatedIdentity()
      .build();

    poleEmploiGateWay.setNextResponse({
      status: 404,
      message: "Ops, something is bad",
    });
    const now = new Date();
    timeGateway.setNextDate(now);

    await broadcastToPe.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
    expectToEqual(errorRepository.savedErrors, [
      {
        serviceName: "PoleEmploiGateway.notifyOnConventionUpdated",
        params: {
          conventionId: convention.id,
          httpStatus: 404,
        },
        message: "Ops, something is bad",
        occurredAt: now,
      },
    ]);
  });

  it("doesn't send notification if feature flag is OFF", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, peAgency } = await prepareUseCase(
      {
        enablePeConventionBroadcastIsActive: false,
      },
    );

    const peExternalId = "peExternalId";
    const immersionConventionId: ConventionId =
      "00000000-0000-0000-0000-000000000000";

    // Act
    const convention = new ConventionDtoBuilder()
      .withAgencyId(peAgency.id)
      .withId(immersionConventionId)
      .withExternalId(peExternalId)
      .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
      .withDateStart("2021-05-13T10:00:00.000Z")
      .withDateEnd("2021-05-14T10:30:00.000Z") // Lasts 1 day and half an hour, ie. 24.5 hours
      .withImmersionObjective("Confirmer un projet professionnel")
      .build();

    await broadcastToPe.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(0);
  });

  it("Converts and sends conventions with federated id if featureFlag is ON", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, peAgency } = await prepareUseCase(
      {
        enablePeConventionBroadcastIsActive: true,
      },
    );

    const immersionConventionId: ConventionId =
      "00000000-0000-0000-0000-000000000000";

    // Act
    const convention = new ConventionDtoBuilder()
      .withAgencyId(peAgency.id)
      .withId(immersionConventionId)
      .withExternalId("1")
      .withImmersionAppelation({
        appellationCode: "11111",
        appellationLabel: "some Appellation",
        romeCode: "A1111",
        romeLabel: "some Rome",
      })
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
      .withDateStart("2021-05-12")
      .withDateEnd("2021-05-14T00:30:00.000Z") //
      .withSchedule(reasonableSchedule)
      .withImmersionObjective("Initier une démarche de recrutement")
      .build();

    await broadcastToPe.execute(convention);

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
    expectObjectsToMatch(poleEmploiGateWay.notifications[0], {
      id: "00000000001",
      peConnectId: "some-id",
      originalId: immersionConventionId,
      objectifDeImmersion: 3,
      dureeImmersion: 21,
      dateDebut: "2021-05-12T00:00:00.000Z",
      dateFin: "2021-05-14T00:30:00.000Z",
      statut: "DEMANDE_VALIDÉE",
      codeAppellation: "011111",
    });
  });
});
