import {
  AgencyDtoBuilder,
  type AgencyId,
  AssessmentDtoBuilder,
  ConventionDtoBuilder,
  type ConventionReadDto,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  UserBuilder,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createAssessmentEntity } from "../../entities/AssessmentEntity";
import type { BroadcastToFranceTravailOnConventionUpdates } from "./BroadcastToFranceTravailOnConventionUpdates";
import {
  type BroadcastToFranceTravailOrchestrator,
  makeBroadcastToFranceTravailOrchestrator,
} from "./BroadcastToFranceTravailOrchestrator";
import type { BroadcastConventionParams } from "./broadcastConventionParams";

describe("BroadcastToFranceTravailOrchestrator", () => {
  let uow: InMemoryUnitOfWork;
  let standardBroadcastToFT: BroadcastToFranceTravailOnConventionUpdates;
  let standardBroadcastCalls: BroadcastConventionParams[];
  let broadcastToFranceTravailOrchestrator: BroadcastToFranceTravailOrchestrator;

  const validator = new UserBuilder().withEmail("validator@email.fr").build();
  const referredAgency = new AgencyDtoBuilder()
    .withId("referred-agency")
    .build();
  const agency = new AgencyDtoBuilder()
    .withRefersToAgencyInfo({
      refersToAgencyId: referredAgency.id,
      refersToAgencyName: referredAgency.name,
      refersToAgencyContactEmail: referredAgency.contactEmail,
    })
    .build();

  const conventionWithoutAssessment = new ConventionDtoBuilder()
    .withId("convention-without-assessment-id")
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withAgencyId(agency.id)
    .build();

  const convention = new ConventionDtoBuilder()
    .withStatus("ACCEPTED_BY_VALIDATOR")
    .withAgencyId(agency.id)
    .build();

  const assessment = new AssessmentDtoBuilder()
    .withConventionId(convention.id)
    .build();

  const conventionReadDto: ConventionReadDto = {
    ...convention,
    agencyName: agency.name,
    agencySiret: agency.agencySiret,
    agencyKind: agency.kind,
    agencyContactEmail: agency.contactEmail,
    agencyRefersTo: {
      id: referredAgency.id,
      name: referredAgency.name,
      contactEmail: referredAgency.contactEmail,
      kind: referredAgency.kind,
      siret: referredAgency.agencySiret,
    },
    agencyDepartment: agency.address.departmentCode,
    agencyValidatorEmails: [validator.email],
    agencyCounsellorEmails: [],
    assessment: {
      status: assessment.status,
      endedWithAJob: assessment.endedWithAJob,
      signedAt: assessment.signedAt,
      createdAt: assessment.createdAt,
    },
    isEstablishmentBanned: false,
  };

  beforeEach(() => {
    ({ standardBroadcastCalls, standardBroadcastToFT } =
      createFakeStandardBroadcastToFT());
    uow = createInMemoryUow();
    broadcastToFranceTravailOrchestrator =
      makeBroadcastToFranceTravailOrchestrator({
        uowPerformer: new InMemoryUowPerformer(uow),
        eventType: "CONVENTION_UPDATED",
        broadcastToFranceTravailOnConventionUpdates: standardBroadcastToFT,
      });

    uow.conventionRepository.setConventions([
      convention,
      conventionWithoutAssessment,
    ]);
    uow.assessmentRepository.assessments = [
      createAssessmentEntity(assessment, convention),
    ];
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

  it("triggers standard broadcast on convention update with assessment when present", async () => {
    await broadcastToFranceTravailOrchestrator.execute({
      conventionId: convention.id,
    });
    expectStandardBroadcastCallsToEqual([
      {
        eventType: "CONVENTION_UPDATED",
        convention: conventionReadDto,
        assessment,
      },
    ]);
  });

  it("does not include assessment key when convention has no assessment", async () => {
    const conventionReadDtoWithoutAssessment: ConventionReadDto = {
      ...conventionWithoutAssessment,
      agencyName: agency.name,
      agencySiret: agency.agencySiret,
      agencyKind: agency.kind,
      agencyContactEmail: agency.contactEmail,
      agencyRefersTo: {
        id: referredAgency.id,
        name: referredAgency.name,
        contactEmail: referredAgency.contactEmail,
        kind: referredAgency.kind,
        siret: referredAgency.agencySiret,
      },
      agencyDepartment: agency.address.departmentCode,
      agencyValidatorEmails: [validator.email],
      agencyCounsellorEmails: [],
      assessment: null,
      isEstablishmentBanned: false,
    };

    await broadcastToFranceTravailOrchestrator.execute({
      conventionId: conventionWithoutAssessment.id,
    });

    expectStandardBroadcastCallsToEqual([
      {
        eventType: "CONVENTION_UPDATED",
        convention: conventionReadDtoWithoutAssessment,
      },
    ]);
  });

  it("does not include assessment key when assessment is legacy", async () => {
    const conventionWithLegacyAssessment = new ConventionDtoBuilder()
      .withId("convention-with-legacy-assessment-id")
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withAgencyId(agency.id)
      .build();

    uow.conventionRepository.setConventions([
      convention,
      conventionWithoutAssessment,
      conventionWithLegacyAssessment,
    ]);
    uow.assessmentRepository.assessments = [
      createAssessmentEntity(assessment, convention),
      {
        _entityName: "Assessment",
        status: "FINISHED",
        conventionId: conventionWithLegacyAssessment.id,
        establishmentFeedback: "commentaire",
        numberOfHoursActuallyMade: null,
        createdAt: new Date("2023-03-11").toISOString(),
      },
    ];

    await broadcastToFranceTravailOrchestrator.execute({
      conventionId: conventionWithLegacyAssessment.id,
    });

    expectStandardBroadcastCallsToEqual([
      {
        eventType: "CONVENTION_UPDATED",
        previousAgencyId: undefined,
        convention: {
          ...conventionWithLegacyAssessment,
          agencyName: agency.name,
          agencySiret: agency.agencySiret,
          agencyKind: agency.kind,
          agencyContactEmail: agency.contactEmail,
          agencyRefersTo: {
            id: referredAgency.id,
            name: referredAgency.name,
            contactEmail: referredAgency.contactEmail,
            kind: referredAgency.kind,
            siret: referredAgency.agencySiret,
          },
          agencyDepartment: agency.address.departmentCode,
          agencyValidatorEmails: [validator.email],
          agencyCounsellorEmails: [],
          assessment: {
            status: "FINISHED",
            createdAt: new Date("2023-03-11").toISOString(),
          },
          isEstablishmentBanned: false,
        },
      },
    ]);
  });

  it("passes previousAgencyId through to standard broadcast", async () => {
    const previousAgencyId: AgencyId = "previous-agency-id";
    await broadcastToFranceTravailOrchestrator.execute({
      conventionId: convention.id,
      previousAgencyId,
    });
    expectStandardBroadcastCallsToEqual([
      {
        eventType: "CONVENTION_UPDATED",
        convention: conventionReadDto,
        previousAgencyId,
        assessment,
      },
    ]);
  });

  describe("when eventType is 'ASSESSMENT_CREATED'", () => {
    let broadcastToFranceTravailOrchestratorForAssessmentCreated: BroadcastToFranceTravailOrchestrator;

    beforeEach(() => {
      broadcastToFranceTravailOrchestratorForAssessmentCreated =
        makeBroadcastToFranceTravailOrchestrator({
          uowPerformer: new InMemoryUowPerformer(uow),
          eventType: "ASSESSMENT_CREATED",
          broadcastToFranceTravailOnConventionUpdates: standardBroadcastToFT,
        });
    });

    it("throws when assessment is missing", async () => {
      await expectPromiseToFailWithError(
        broadcastToFranceTravailOrchestratorForAssessmentCreated.execute({
          conventionId: conventionWithoutAssessment.id,
        }),
        errors.assessment.missingAssessment({
          conventionId: conventionWithoutAssessment.id,
        }),
      );
    });

    it("triggers standard broadcast with assessment when all is good", async () => {
      await broadcastToFranceTravailOrchestratorForAssessmentCreated.execute({
        conventionId: convention.id,
      });
      expectStandardBroadcastCallsToEqual([
        {
          eventType: "ASSESSMENT_CREATED",
          convention: conventionReadDto,
          assessment,
        },
      ]);
    });
  });

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
