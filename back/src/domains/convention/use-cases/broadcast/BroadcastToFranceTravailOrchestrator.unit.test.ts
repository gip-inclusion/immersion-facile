import {
  AssessmentDtoBuilder,
  ConventionDtoBuilder,
  type WithConventionDto,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import type { BroadcastToFranceTravailOnConventionUpdates } from "./BroadcastToFranceTravailOnConventionUpdates";
import type { BroadcastToFranceTravailOnConventionUpdatesLegacy } from "./BroadcastToFranceTravailOnConventionUpdatesLegacy";
import {
  type BroadcastToFranceTravailOrchestrator,
  makeBroadcastToFranceTravailOrchestrator,
} from "./BroadcastToFranceTravailOrchestrator";
import type { BroadcastConventionParams } from "./broadcastConventionParams";

describe("BroadcastToFranceTravailOrchestrator", () => {
  let uow: InMemoryUnitOfWork;
  let standardBroadcastToFT: BroadcastToFranceTravailOnConventionUpdates;
  let standardBroadcastCalls: BroadcastConventionParams[];
  let legacyBroadcastToFT: BroadcastToFranceTravailOnConventionUpdatesLegacy;
  let legacyBroadcastCalls: WithConventionDto[];
  let broadcastToFranceTravailOrchestrator: BroadcastToFranceTravailOrchestrator;

  const convention = new ConventionDtoBuilder().build();
  const assessment = new AssessmentDtoBuilder()
    .withConventionId(convention.id)
    .build();

  beforeEach(() => {
    ({ standardBroadcastCalls, standardBroadcastToFT } =
      createFakeStandardBroadcastToFT());
    ({ legacyBroadcastCalls, legacyBroadcastToFT } =
      createFakeLegacyBroadcastToFT());
    uow = createInMemoryUow();
    broadcastToFranceTravailOrchestrator =
      makeBroadcastToFranceTravailOrchestrator({
        uowPerformer: new InMemoryUowPerformer(uow),
        eventType: "CONVENTION_UPDATED",
        broadcastToFranceTravailOnConventionUpdates: standardBroadcastToFT,
        broadcastToFranceTravailOnConventionUpdatesLegacy: legacyBroadcastToFT,
      });
  });

  describe("When enableStandardFormatBroadcastToFT feature flag is OFF", () => {
    beforeEach(() => {
      uow.featureFlagRepository.update({
        flagName: "enableStandardFormatBroadcastToFranceTravail",
        featureFlag: { kind: "boolean", isActive: false },
      });
    });

    it("triggers legacy broadcast", async () => {
      await broadcastToFranceTravailOrchestrator.execute({
        convention,
        assessment,
      });
      expectLegacyBroadcastCallsToEqual([{ convention }]);
    });

    it("does NOT trigger standard format broadcast", async () => {
      await broadcastToFranceTravailOrchestrator.execute({ convention });
      expectStandardBroadcastCallsToEqual([]);
    });

    it("does NOTHING when eventType is 'ASSESSMENT_CREATED'", async () => {
      const broadcastToFranceTravailOrchestratorForAssementCreated =
        makeBroadcastToFranceTravailOrchestrator({
          uowPerformer: new InMemoryUowPerformer(uow),
          eventType: "ASSESSMENT_CREATED",
          broadcastToFranceTravailOnConventionUpdates: standardBroadcastToFT,
          broadcastToFranceTravailOnConventionUpdatesLegacy:
            legacyBroadcastToFT,
        });

      await broadcastToFranceTravailOrchestratorForAssementCreated.execute({
        convention,
        assessment,
      });

      expectLegacyBroadcastCallsToEqual([]);
      expectStandardBroadcastCallsToEqual([]);
    });
  });

  describe("When enableStandardFormatBroadcastToFT feature flag is ON", () => {
    beforeEach(() => {
      uow.featureFlagRepository.update({
        flagName: "enableStandardFormatBroadcastToFranceTravail",
        featureFlag: { kind: "boolean", isActive: true },
      });
    });

    it("triggers standard broadcast", async () => {
      await broadcastToFranceTravailOrchestrator.execute({ convention });
      expectStandardBroadcastCallsToEqual([
        { eventType: "CONVENTION_UPDATED", convention },
      ]);
    });

    it("does NOT trigger legacy broadcast", async () => {
      await broadcastToFranceTravailOrchestrator.execute({ convention });
      expectLegacyBroadcastCallsToEqual([]);
    });

    describe("when eventType is 'ASSESSMENT_CREATED'", () => {
      let broadcastToFranceTravailOrchestratorForAssessmentCreated: BroadcastToFranceTravailOrchestrator;

      beforeEach(() => {
        broadcastToFranceTravailOrchestratorForAssessmentCreated =
          makeBroadcastToFranceTravailOrchestrator({
            uowPerformer: new InMemoryUowPerformer(uow),
            eventType: "ASSESSMENT_CREATED",
            broadcastToFranceTravailOnConventionUpdates: standardBroadcastToFT,
            broadcastToFranceTravailOnConventionUpdatesLegacy:
              legacyBroadcastToFT,
          });
      });

      it("throws when assessment is missing", async () => {
        await expectPromiseToFailWithError(
          broadcastToFranceTravailOrchestratorForAssessmentCreated.execute({
            convention,
          }),
          errors.assessment.missingAssessment({ conventionId: convention.id }),
        );
      });

      it("triggers standard broadcast, with assessment when all is good", async () => {
        await broadcastToFranceTravailOrchestratorForAssessmentCreated.execute({
          convention,
          assessment,
        });

        expectLegacyBroadcastCallsToEqual([]);
        expectStandardBroadcastCallsToEqual([
          {
            eventType: "ASSESSMENT_CREATED",
            convention,
            assessment,
          },
        ]);
      });
    });
  });

  const expectLegacyBroadcastCallsToEqual = (expected: WithConventionDto[]) => {
    expectToEqual(legacyBroadcastCalls, expected);
  };
  const expectStandardBroadcastCallsToEqual = (
    expected: BroadcastConventionParams[],
  ) => {
    expectToEqual(standardBroadcastCalls, expected);
  };
});

const createFakeStandardBroadcastToFT = (): {
  standardBroadcastToFT: BroadcastToFranceTravailOnConventionUpdates;
  standardBroadcastCalls: BroadcastConventionParams[];
} => {
  const standardBroadcastCalls: BroadcastConventionParams[] = [];
  return {
    standardBroadcastCalls,
    standardBroadcastToFT: {
      useCaseName: "BroadcastToFranceTravailOnConventionUpdates",
      execute: async (params) => {
        standardBroadcastCalls.push(params);
      },
    },
  };
};

const createFakeLegacyBroadcastToFT = (): {
  legacyBroadcastToFT: BroadcastToFranceTravailOnConventionUpdatesLegacy;
  legacyBroadcastCalls: WithConventionDto[];
} => {
  const legacyBroadcastCalls: WithConventionDto[] = [];
  return {
    legacyBroadcastCalls,
    legacyBroadcastToFT: {
      useCaseName: "BroadcastToFranceTravailOnConventionUpdates",
      execute: async (params) => {
        legacyBroadcastCalls.push(params);
      },
    },
  };
};
