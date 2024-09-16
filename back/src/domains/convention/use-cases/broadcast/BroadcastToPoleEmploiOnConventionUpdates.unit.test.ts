import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionId,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  reasonableSchedule,
} from "shared";
import { broadcastToPeServiceName } from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryPoleEmploiGateway } from "../../adapters/pole-emploi-gateway/InMemoryPoleEmploiGateway";
import { BroadcastToPoleEmploiOnConventionUpdates } from "./BroadcastToPoleEmploiOnConventionUpdates";

const prepareUseCase = async () => {
  const poleEmploiGateWay = new InMemoryPoleEmploiGateway();
  const uow = createInMemoryUow();
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
    peAgency,
    timeGateway,
    uow,
  };
};

describe("Broadcasts events to pole-emploi", () => {
  it("Skips convention if not linked to an agency of kind pole-emploi nor agencyRefersTo of kind pole-emploi", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, uow } = await prepareUseCase();

    const agency = new AgencyDtoBuilder().withKind("mission-locale").build();
    await uow.agencyRepository.setAgencies([agency]);

    // Act
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agency.id)
      .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
      .build();

    await broadcastToPe.execute({ convention });

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(0);
  });

  it("Conventions without federated id are still sent, with their externalId", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, peAgency, uow } =
      await prepareUseCase();

    const immersionConventionId: ConventionId =
      "00000000-0000-4000-0000-000000000000";
    const externalId = "00000000001";

    uow.conventionExternalIdRepository.externalIdsByConventionId = {
      [immersionConventionId]: externalId,
    };

    // Act
    const convention = new ConventionDtoBuilder()
      .withId(immersionConventionId)
      .withAgencyId(peAgency.id)
      .withoutFederatedIdentity()
      .build();

    await broadcastToPe.execute({ convention });

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
    expectObjectsToMatch(poleEmploiGateWay.notifications[0], {
      originalId: immersionConventionId,
      id: externalId,
    });
  });

  it("If Pe returns a 404 error, we store the error in a repo", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, peAgency, uow, timeGateway } =
      await prepareUseCase();

    // Act
    const convention = new ConventionDtoBuilder()
      .withAgencyId(peAgency.id)
      .withoutFederatedIdentity()
      .build();

    poleEmploiGateWay.setNextResponse({
      status: 404,
      subscriberErrorFeedback: { message: "Ops, something is bad" },
      body: "not found",
    });
    const now = new Date();
    timeGateway.setNextDate(now);

    await broadcastToPe.execute({ convention });

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
    expectToEqual(uow.broadcastFeedbacksRepository.broadcastFeedbacks, [
      {
        consumerId: null,
        consumerName: "France Travail",
        serviceName: broadcastToPeServiceName,
        requestParams: {
          conventionId: convention.id,
          conventionStatus: convention.status,
        },
        response: { httpStatus: 404, body: "not found" },
        subscriberErrorFeedback: {
          message: "Ops, something is bad",
        },
        occurredAt: now,
        handledByAgency: false,
      },
    ]);
  });

  it("store the broadcast feetback success in a repo", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, peAgency, uow, timeGateway } =
      await prepareUseCase();

    // Act
    const convention = new ConventionDtoBuilder()
      .withAgencyId(peAgency.id)
      .withoutFederatedIdentity()
      .build();

    poleEmploiGateWay.setNextResponse({
      status: 200,
      body: { success: true },
    });
    const now = new Date();
    timeGateway.setNextDate(now);

    await broadcastToPe.execute({ convention });

    // Assert
    expectToEqual(uow.broadcastFeedbacksRepository.broadcastFeedbacks, [
      {
        consumerId: null,
        consumerName: "France Travail",
        serviceName: broadcastToPeServiceName,
        requestParams: {
          conventionId: convention.id,
          conventionStatus: convention.status,
        },
        response: {
          httpStatus: 200,
          body: {
            success: true,
          },
        },
        occurredAt: now,
        handledByAgency: false,
      },
    ]);
  });

  it("Converts and sends conventions, with externalId and federated id", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, peAgency, uow } =
      await prepareUseCase();

    const immersionConventionId: ConventionId =
      "00000000-0000-0000-0000-000000000000";

    const externalId = "00000000001";
    uow.conventionExternalIdRepository.externalIdsByConventionId = {
      [immersionConventionId]: externalId,
    };

    // Act
    const convention = new ConventionDtoBuilder()
      .withId(immersionConventionId)
      .withAgencyId(peAgency.id)
      .withImmersionAppellation({
        appellationCode: "11111",
        appellationLabel: "some Appellation",
        romeCode: "A1111",
        romeLabel: "some Rome",
      })
      .withBeneficiaryBirthdate("2000-10-05")
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
      .withDateStart("2021-05-12")
      .withDateEnd("2021-05-14T00:30:00.000Z") //
      .withSchedule(reasonableSchedule)
      .withImmersionObjective("Initier une démarche de recrutement")
      .build();

    await broadcastToPe.execute({ convention });

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
    expectObjectsToMatch(poleEmploiGateWay.notifications[0], {
      id: externalId,
      peConnectId: "some-id",
      originalId: immersionConventionId,
      objectifDeImmersion: 3,
      dureeImmersion: 21,
      dateDebut: "2021-05-12T00:00:00.000Z",
      dateFin: "2021-05-14T00:30:00.000Z",
      dateNaissance: "2000-10-05T00:00:00.000Z",
      statut: "DEMANDE_VALIDÉE",
      codeAppellation: "011111",
    });
  });

  it("if an axios error happens", async () => {
    const { broadcastToPe, peAgency } = await prepareUseCase();

    const convention = new ConventionDtoBuilder()
      .withStatus("DEPRECATED")
      .withAgencyId(peAgency.id)
      .withoutFederatedIdentity()
      .build();

    await expectPromiseToFailWithError(
      broadcastToPe.execute({ convention }),
      new Error("fake axios error"),
    );
  });

  it("broadcast to pole-emploi when convention is from an agency RefersTo", async () => {
    // Prepare
    const { broadcastToPe, poleEmploiGateWay, peAgency, uow } =
      await prepareUseCase();
    const agencyWithRefersTo = new AgencyDtoBuilder()
      .withKind("autre")
      .withRefersToAgencyId(peAgency.id)
      .build();

    await uow.agencyRepository.setAgencies([peAgency, agencyWithRefersTo]);

    const immersionConventionId: ConventionId =
      "00000000-0000-0000-0000-000000000000";

    const externalId = "00000000001";
    uow.conventionExternalIdRepository.externalIdsByConventionId = {
      [immersionConventionId]: externalId,
    };

    // Act
    const convention = new ConventionDtoBuilder()
      .withId(immersionConventionId)
      .withAgencyId(agencyWithRefersTo.id)
      .withImmersionAppellation({
        appellationCode: "11111",
        appellationLabel: "some Appellation",
        romeCode: "A1111",
        romeLabel: "some Rome",
      })
      .withBeneficiaryBirthdate("2000-10-05")
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withFederatedIdentity({ provider: "peConnect", token: "some-id" })
      .withDateStart("2021-05-12")
      .withDateEnd("2021-05-14T00:30:00.000Z") //
      .withSchedule(reasonableSchedule)
      .withImmersionObjective("Initier une démarche de recrutement")
      .build();

    await broadcastToPe.execute({ convention });

    // Assert
    expect(poleEmploiGateWay.notifications).toHaveLength(1);
    expectObjectsToMatch(poleEmploiGateWay.notifications[0], {
      id: externalId,
      peConnectId: "some-id",
      originalId: immersionConventionId,
      objectifDeImmersion: 3,
      dureeImmersion: 21,
      dateDebut: "2021-05-12T00:00:00.000Z",
      dateFin: "2021-05-14T00:30:00.000Z",
      dateNaissance: "2000-10-05T00:00:00.000Z",
      statut: "DEMANDE_VALIDÉE",
      codeAppellation: "011111",
    });
  });
});
