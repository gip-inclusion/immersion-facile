import {
  AgencyDtoBuilder,
  type AgencyKind,
  ConventionDtoBuilder,
  type ConventionId,
  errors,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
  type FeatureFlags,
  reasonableSchedule,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import { broadcastToFtLegacyServiceName } from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { InMemoryFranceTravailGateway } from "../../adapters/france-travail-gateway/InMemoryFranceTravailGateway";
import type { AgencyKindForFt } from "../../ports/FranceTravailGateway";
import {
  type BroadcastToFranceTravailOnConventionUpdatesLegacy,
  makeBroadcastToFranceTravailOnConventionUpdatesLegacy,
} from "./BroadcastToFranceTravailOnConventionUpdatesLegacy";

describe("Broadcasts events to France Travail (LEGACY Version)", () => {
  const peAgencyWithoutCounsellorsAndValidators = new AgencyDtoBuilder()
    .withId("some-pe-agency")
    .withKind("pole-emploi")
    .build();

  let franceTravailGateway: InMemoryFranceTravailGateway;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let broadcastToFranceTravailOnConventionUpdates: BroadcastToFranceTravailOnConventionUpdatesLegacy;

  const agencySIAE = toAgencyWithRights(
    new AgencyDtoBuilder(peAgencyWithoutCounsellorsAndValidators)
      .withId("agency-SIAE-id")
      .withKind("structure-IAE")
      .build(),
  );

  const conventionLinkedToSIAE = new ConventionDtoBuilder()
    .withId("11110000-0000-4000-a000-000000000001")
    .withAgencyId(agencySIAE.id)
    .build();

  const conventionLinkedToFTWithoutFederatedIdentity =
    new ConventionDtoBuilder()
      .withId("00000000-0000-4000-9000-000000000000")
      .withAgencyId(peAgencyWithoutCounsellorsAndValidators.id)
      .withoutFederatedIdentity()
      .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    franceTravailGateway = new InMemoryFranceTravailGateway();
    timeGateway = new CustomTimeGateway();
    broadcastToFranceTravailOnConventionUpdates =
      makeBroadcastToFranceTravailOnConventionUpdatesLegacy({
        uowPerformer: new InMemoryUowPerformer(uow),
        deps: {
          franceTravailGateway,
          timeGateway,
          options: { resyncMode: false },
        },
      });
    uow.agencyRepository.agencies = [
      toAgencyWithRights(peAgencyWithoutCounsellorsAndValidators),
    ];
  });

  it("Skips convention if not linked to an agency of kind pole-emploi nor agencyRefersTo of kind pole-emploi", async () => {
    uow.agencyRepository.agencies = [agencySIAE];

    await broadcastToFranceTravailOnConventionUpdates.execute({
      convention: conventionLinkedToSIAE,
    });

    expect(franceTravailGateway.legacyBroadcastConventionCalls).toHaveLength(0);
  });

  it("Conventions without federated id are still sent, with their externalId", async () => {
    const externalId = "00000000001";
    uow.conventionExternalIdRepository.externalIdsByConventionId = {
      [conventionLinkedToFTWithoutFederatedIdentity.id]: externalId,
    };

    await broadcastToFranceTravailOnConventionUpdates.execute({
      convention: conventionLinkedToFTWithoutFederatedIdentity,
    });

    // Assert
    expect(franceTravailGateway.legacyBroadcastConventionCalls).toHaveLength(1);
    expectObjectsToMatch(
      franceTravailGateway.legacyBroadcastConventionCalls[0],
      {
        originalId: conventionLinkedToFTWithoutFederatedIdentity.id,
        id: externalId,
      },
    );
  });

  it("If Pe returns a 404 error, we store the error in a repo", async () => {
    franceTravailGateway.setNextLegacyResponse({
      status: 404,
      subscriberErrorFeedback: { message: "Ops, something is bad" },
      body: "not found",
    });
    const now = new Date();
    timeGateway.setNextDate(now);

    // Act
    await broadcastToFranceTravailOnConventionUpdates.execute({
      convention: conventionLinkedToFTWithoutFederatedIdentity,
    });

    // Assert
    expect(franceTravailGateway.legacyBroadcastConventionCalls).toHaveLength(1);
    expectToEqual(uow.broadcastFeedbacksRepository.broadcastFeedbacks, [
      {
        consumerId: null,
        consumerName: "France Travail",
        serviceName: broadcastToFtLegacyServiceName,
        requestParams: {
          conventionId: conventionLinkedToFTWithoutFederatedIdentity.id,
          conventionStatus: conventionLinkedToFTWithoutFederatedIdentity.status,
        },
        response: { httpStatus: 404, body: "not found" },
        subscriberErrorFeedback: {
          message: "Ops, something is bad",
        },
        occurredAt: now.toISOString(),
        handledByAgency: false,
      },
    ]);
  });

  it("store the broadcast feetback success in a repo", async () => {
    franceTravailGateway.setNextLegacyResponse({
      status: 200,
      body: { success: true },
    });
    const now = new Date();
    timeGateway.setNextDate(now);

    // Act
    await broadcastToFranceTravailOnConventionUpdates.execute({
      convention: conventionLinkedToFTWithoutFederatedIdentity,
    });

    // Assert
    expectToEqual(uow.broadcastFeedbacksRepository.broadcastFeedbacks, [
      {
        consumerId: null,
        consumerName: "France Travail",
        serviceName: broadcastToFtLegacyServiceName,
        requestParams: {
          conventionId: conventionLinkedToFTWithoutFederatedIdentity.id,
          conventionStatus: conventionLinkedToFTWithoutFederatedIdentity.status,
        },
        response: {
          httpStatus: 200,
          body: {
            success: true,
          },
        },
        occurredAt: now.toISOString(),
        handledByAgency: false,
      },
    ]);
  });

  it("Converts and sends conventions, with externalId and federated id", async () => {
    // Prepare
    const immersionConventionId: ConventionId =
      "00000000-0000-0000-0000-000000000000";

    const externalId = "00000000001";
    uow.conventionExternalIdRepository.externalIdsByConventionId = {
      [immersionConventionId]: externalId,
    };

    const convention = new ConventionDtoBuilder()
      .withId(immersionConventionId)
      .withAgencyId(peAgencyWithoutCounsellorsAndValidators.id)
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

    // Act
    await broadcastToFranceTravailOnConventionUpdates.execute({ convention });

    // Assert
    expect(franceTravailGateway.legacyBroadcastConventionCalls).toHaveLength(1);
    expectObjectsToMatch(
      franceTravailGateway.legacyBroadcastConventionCalls[0],
      {
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
      },
    );
  });

  it("if an axios error happens", async () => {
    const convention = new ConventionDtoBuilder()
      .withStatus("DEPRECATED")
      .withAgencyId(peAgencyWithoutCounsellorsAndValidators.id)
      .withoutFederatedIdentity()
      .build();

    await expectPromiseToFailWithError(
      broadcastToFranceTravailOnConventionUpdates.execute({ convention }),
      errors.generic.fakeError("fake axios error"),
    );
  });

  it("broadcast to pole-emploi when convention is from an agency RefersTo", async () => {
    // Prepare
    const agencyWithRefersTo = toAgencyWithRights(
      new AgencyDtoBuilder(peAgencyWithoutCounsellorsAndValidators)
        .withId("635354435345435")
        .withKind("autre")
        .withRefersToAgencyInfo({
          refersToAgencyId: peAgencyWithoutCounsellorsAndValidators.id,
          refersToAgencyName: peAgencyWithoutCounsellorsAndValidators.name,
        })
        .build(),
    );

    const conventionLinkedToAgencyReferingToOther = new ConventionDtoBuilder()
      .withId("22222222-2222-4000-9222-222222222222")
      .withAgencyId(agencyWithRefersTo.id)
      .withImmersionAppellation({
        appellationCode: "11111",
        appellationLabel: "some Appellation",
        romeCode: "A1111",
        romeLabel: "some Rome",
      })
      .withBeneficiaryBirthdate("2000-10-05")
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateStart("2021-05-12")
      .withDateEnd("2021-05-14T00:30:00.000Z") //
      .withSchedule(reasonableSchedule)
      .withImmersionObjective("Initier une démarche de recrutement")
      .build();

    uow.agencyRepository.agencies = [
      toAgencyWithRights(peAgencyWithoutCounsellorsAndValidators),
      agencyWithRefersTo,
    ];

    const externalId = "00000000001";
    uow.conventionExternalIdRepository.externalIdsByConventionId = {
      [conventionLinkedToAgencyReferingToOther.id]: externalId,
    };

    await broadcastToFranceTravailOnConventionUpdates.execute({
      convention: conventionLinkedToAgencyReferingToOther,
    });

    // Assert
    expect(franceTravailGateway.legacyBroadcastConventionCalls).toHaveLength(1);
    expectObjectsToMatch(
      franceTravailGateway.legacyBroadcastConventionCalls[0],
      {
        id: externalId,
        originalId: conventionLinkedToAgencyReferingToOther.id,
        objectifDeImmersion: 3,
        dureeImmersion: 21,
        dateDebut: "2021-05-12T00:00:00.000Z",
        dateFin: "2021-05-14T00:30:00.000Z",
        dateNaissance: "2000-10-05T00:00:00.000Z",
        statut: "DEMANDE_VALIDÉE",
        codeAppellation: "011111",
      },
    );
  });

  describe("sends also other type of Convention when corresponding feature flag is activated", () => {
    const createAgencyAndLinkedConvention = (kind: AgencyKind) => {
      const agency = toAgencyWithRights(
        new AgencyDtoBuilder().withId(kind).withKind(kind).build(),
      );

      return {
        agency,
        convention: new ConventionDtoBuilder()
          .withId("33333333-3333-4000-9333-333333333333")
          .withAgencyId(agency.id)
          .build(),
      };
    };

    describe.each([
      {
        agencyKind: "mission-locale" as AgencyKindForFt,
        featureFlag: {
          enableBroadcastOfMissionLocaleToFT: {
            kind: "boolean",
            isActive: true,
          },
        } as Partial<FeatureFlags>,
        ...createAgencyAndLinkedConvention("mission-locale"),
      },
      {
        agencyKind: "conseil-departemental" as AgencyKindForFt,
        featureFlag: {
          enableBroadcastOfConseilDepartementalToFT: {
            kind: "boolean",
            isActive: true,
          },
        } as Partial<FeatureFlags>,
        ...createAgencyAndLinkedConvention("conseil-departemental"),
      },
      {
        agencyKind: "cap-emploi" as AgencyKindForFt,
        featureFlag: {
          enableBroadcastOfCapEmploiToFT: {
            kind: "boolean",
            isActive: true,
          },
        } as Partial<FeatureFlags>,
        ...createAgencyAndLinkedConvention("cap-emploi"),
      },
    ])("when enable $agencyKind feature flag is ACTIVE", ({
      agencyKind,
      featureFlag,
      agency,
      convention,
    }) => {
      it(`broadcasts to france travail, even for convention linked to ${agencyKind}`, async () => {
        uow.agencyRepository.agencies = [agency];
        uow.featureFlagRepository.featureFlags = {
          enableBroadcastOfMissionLocaleToFT: {
            kind: "boolean",
            isActive: false,
          },
          enableBroadcastOfCapEmploiToFT: {
            kind: "boolean",
            isActive: false,
          },
          enableBroadcastOfConseilDepartementalToFT: {
            kind: "boolean",
            isActive: false,
          },
          ...featureFlag,
        };
        await broadcastToFranceTravailOnConventionUpdates.execute({
          convention,
        });

        expect(
          franceTravailGateway.legacyBroadcastConventionCalls,
        ).toHaveLength(1);
        expectObjectsToMatch(
          franceTravailGateway.legacyBroadcastConventionCalls[0],
          {
            siret: convention.siret,
            typeAgence: agencyKind,
          },
        );
      });

      it(`do not broadcast to france travail when convention is from an agency RefersTo (and the refered agency is ${agencyKind})`, async () => {
        uow.featureFlagRepository.featureFlags = featureFlag;

        const agencyWithRefersTo = toAgencyWithRights(
          new AgencyDtoBuilder(peAgencyWithoutCounsellorsAndValidators)
            .withId("agency-with-refers-to-id")
            .withKind("autre")
            .withRefersToAgencyInfo({
              refersToAgencyId: agency.id,
              refersToAgencyName: agency.name,
            })
            .build(),
        );

        const conventionLinkedToAgencyReferingToOther =
          new ConventionDtoBuilder()
            .withId("22222222-2222-4000-9222-222222222222")
            .withAgencyId(agencyWithRefersTo.id)
            .withStatus("ACCEPTED_BY_VALIDATOR")
            .build();

        uow.agencyRepository.agencies = [agency, agencyWithRefersTo];

        const externalId = "00000000001";
        uow.conventionExternalIdRepository.externalIdsByConventionId = {
          [conventionLinkedToAgencyReferingToOther.id]: externalId,
        };

        await broadcastToFranceTravailOnConventionUpdates.execute({
          convention: conventionLinkedToAgencyReferingToOther,
        });

        // Assert
        expect(
          franceTravailGateway.legacyBroadcastConventionCalls,
        ).toHaveLength(0);
      });
    });

    describe.each([
      {
        agencyKind: "mission-locale" as AgencyKindForFt,
        ...createAgencyAndLinkedConvention("mission-locale"),
      },
      {
        agencyKind: "conseil-departemental" as AgencyKindForFt,
        ...createAgencyAndLinkedConvention("conseil-departemental"),
      },
      {
        agencyKind: "cap-emploi" as AgencyKindForFt,
        ...createAgencyAndLinkedConvention("cap-emploi"),
      },
    ])("when $agencyKind feature flag is OFF", ({
      agencyKind,
      agency,
      convention,
    }) => {
      it(`does NOT broadcasts to france travail, for ${agencyKind}`, async () => {
        uow.agencyRepository.agencies = [agency];
        uow.featureFlagRepository.featureFlags = {
          enableBroadcastOfMissionLocaleToFT: {
            kind: "boolean",
            isActive: false,
          },
          enableBroadcastOfCapEmploiToFT: {
            kind: "boolean",
            isActive: false,
          },
          enableBroadcastOfConseilDepartementalToFT: {
            kind: "boolean",
            isActive: false,
          },
        };

        await broadcastToFranceTravailOnConventionUpdates.execute({
          convention,
        });

        expect(
          franceTravailGateway.legacyBroadcastConventionCalls,
        ).toHaveLength(0);
      });
    });
  });
});
