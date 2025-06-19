import {
  AgencyDtoBuilder,
  AssessmentDtoBuilder,
  ConventionDtoBuilder,
  type ConventionReadDto,
  UserBuilder,
  type WithConventionDto,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
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

  const validator = new UserBuilder().withEmail("validator@email.fr").build();
  const referredAgency = new AgencyDtoBuilder()
    .withId("referred-agency")
    .build();
  const agency = new AgencyDtoBuilder()
    .withRefersToAgencyInfo({
      refersToAgencyId: referredAgency.id,
      refersToAgencyName: referredAgency.name,
    })
    .build();
  const convention = new ConventionDtoBuilder().withAgencyId(agency.id).build();
  const conventionReadDto: ConventionReadDto = {
    ...convention,
    agencyName: agency.name,
    agencySiret: agency.agencySiret,
    agencyKind: agency.kind,
    agencyRefersTo: {
      id: referredAgency.id,
      name: referredAgency.name,
      kind: referredAgency.kind,
    },
    agencyDepartment: agency.address.departmentCode,
    agencyValidatorEmails: [validator.email],
    agencyCounsellorEmails: [],
  };
  const assessment = new AssessmentDtoBuilder()
    .withConventionId(conventionReadDto.id)
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

    uow.conventionRepository.setConventions([convention]);
    uow.userRepository.users = [validator];
    uow.agencyRepository.agencies = [
      toAgencyWithRights(agency, {
        [validator.id]: {
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      }),
      toAgencyWithRights(referredAgency),
    ];
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
        convention: conventionReadDto,
        assessment,
      });
      expectLegacyBroadcastCallsToEqual([{ convention: conventionReadDto }]);
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
        { eventType: "CONVENTION_UPDATED", convention: conventionReadDto },
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
            convention: conventionReadDto,
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
