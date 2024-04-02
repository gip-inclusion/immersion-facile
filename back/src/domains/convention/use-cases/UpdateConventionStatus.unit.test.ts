import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionId,
  createConventionMagicLinkPayload,
  expectObjectsToMatch,
  expectPromiseToFailWith,
  expectPromiseToFailWithError,
  validSignatoryRoles,
} from "shared";
import { NotFoundError } from "../../../config/helpers/httpErrors";
import { agencyMissingMessage } from "../../agency/ports/AgencyRepository";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { conventionMissingMessage } from "../entities/Convention";
import { UpdateConventionStatus } from "./UpdateConventionStatus";
import {
  conventionWithAgencyTwoStepsValidationId,
  executeUpdateConventionStatusUseCase,
  originalConventionId,
  setupInitialState,
  testForAllRolesAndInitialStatusCases,
} from "./UpdateConventionStatus.testHelpers";

describe("UpdateConventionStatus", () => {
  describe("* -> DRAFT transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "DRAFT",
        statusJustification: "test justification",
        conventionId: originalConventionId,
        modifierRole: "beneficiary",
      },
      expectedDomainTopic: "ConventionRequiresModification",
      updatedFields: {
        statusJustification: "test justification",
        establishmentRepresentativeSignedAt: undefined,
        beneficiarySignedAt: undefined,
      },
      allowedMagicLinkRoles: [
        "beneficiary",
        "establishment-representative",
        "beneficiary-representative",
        "beneficiary-current-employer",
        "counsellor",
        "validator",
        "backOffice",
      ],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleCounsellor",
        "icUserWithRoleValidator",
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: [
        "READY_TO_SIGN",
        "PARTIALLY_SIGNED",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });

    it("ConventionRequiresModification event only has the role of the user that requested the change", async () => {
      const uow = createInMemoryUow();

      const outboxRepo = uow.outboxRepository;

      const timeGateway = new CustomTimeGateway();

      const createNewEvent = makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new TestUuidGenerator(),
      });

      const conventionRepository = uow.conventionRepository;
      const agencyRepository = uow.agencyRepository;
      const uowPerformer = new InMemoryUowPerformer(uow);
      const updateConventionStatus = new UpdateConventionStatus(
        uowPerformer,
        createNewEvent,
        timeGateway,
      );

      const conventionId = "add5c20e-6dd2-45af-affe-927358004444";
      const requesterRole = "beneficiary";

      const conventionBuilder = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(conventionId)
        .build();
      const agency = new AgencyDtoBuilder().build();

      await conventionRepository.save(conventionBuilder);
      agencyRepository.agencies = [agency];

      await updateConventionStatus.execute(
        {
          status: "DRAFT",
          statusJustification: "because",
          conventionId,
          modifierRole: "beneficiary",
        },
        { applicationId: conventionId, role: requesterRole, emailHash: "" },
      );

      const convention = await conventionRepository.getById(conventionId);

      expect(outboxRepo.events).toHaveLength(1);

      expectObjectsToMatch(
        outboxRepo.events[0],
        createNewEvent({
          topic: "ConventionRequiresModification",
          payload: {
            convention,
            justification: "because",
            requesterRole,
            modifierRole: "beneficiary",
          },
        }),
      );
    });

    it("Throw when no agency was found", async () => {
      const uow = createInMemoryUow();

      const timeGateway = new CustomTimeGateway();

      const createNewEvent = makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new TestUuidGenerator(),
      });

      const conventionRepository = uow.conventionRepository;
      const uowPerformer = new InMemoryUowPerformer(uow);
      const updateConventionStatus = new UpdateConventionStatus(
        uowPerformer,
        createNewEvent,
        timeGateway,
      );

      const conventionId = "add5c20e-6dd2-45af-affe-927358004444";
      const requesterRole = "counsellor";

      const agency = new AgencyDtoBuilder().build();

      const conventionBuilder = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(conventionId)
        .withAgencyId(agency.id)
        .build();

      await conventionRepository.save(conventionBuilder);

      await expectPromiseToFailWith(
        updateConventionStatus.execute(
          {
            status: "DRAFT",
            statusJustification: "because",
            conventionId,
            modifierRole: "counsellor",
          },
          {
            applicationId: conventionId,
            role: requesterRole,
            emailHash: "osef",
          },
        ),
        agencyMissingMessage(agency.id),
      );
    });

    it("Throw when modifier role is counsellor or validator and that no mail adress were found", async () => {
      const uow = createInMemoryUow();

      const timeGateway = new CustomTimeGateway();

      const createNewEvent = makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new TestUuidGenerator(),
      });

      const conventionRepository = uow.conventionRepository;
      const uowPerformer = new InMemoryUowPerformer(uow);
      const updateConventionStatus = new UpdateConventionStatus(
        uowPerformer,
        createNewEvent,
        timeGateway,
      );

      const conventionId = "add5c20e-6dd2-45af-affe-927358004444";
      const requesterRole = "counsellor";

      const agency = new AgencyDtoBuilder().build();

      uow.agencyRepository.setAgencies([agency]);

      const conventionBuilder = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(conventionId)
        .withAgencyId(agency.id)
        .build();

      await conventionRepository.save(conventionBuilder);

      await expectPromiseToFailWith(
        updateConventionStatus.execute(
          {
            status: "DRAFT",
            statusJustification: "because",
            conventionId,
            modifierRole: "counsellor",
          },
          {
            applicationId: conventionId,
            role: requesterRole,
            emailHash: "osef",
          },
        ),
        `Mail not found for agency with id: ${agency.id} on agency repository.`,
      );
    });
  });

  describe("* -> READY_TO_SIGN transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "READY_TO_SIGN",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: null,
      allowedMagicLinkRoles: validSignatoryRoles,
      allowedInclusionConnectedUsers: [
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: ["DRAFT"],
    });
  });

  describe("* -> PARTIALLY_SIGNED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "PARTIALLY_SIGNED",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ConventionPartiallySigned",
      allowedMagicLinkRoles: validSignatoryRoles,
      allowedInclusionConnectedUsers: [
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: ["READY_TO_SIGN", "PARTIALLY_SIGNED"],
    });
  });

  describe("* -> IN_REVIEW transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "IN_REVIEW",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ConventionFullySigned",
      allowedMagicLinkRoles: validSignatoryRoles,
      allowedInclusionConnectedUsers: [
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: ["PARTIALLY_SIGNED"],
    });
  });

  describe("* -> ACCEPTED_BY_COUNSELLOR transition", () => {
    const dateApproval = new Date("2021-09-01T10:10:00.000Z");
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "ACCEPTED_BY_COUNSELLOR",
        conventionId: originalConventionId,
        firstname: "Counsellor Firstname",
        lastname: "Counsellor Lastname",
      },
      updatedFields: {
        dateApproval: dateApproval.toISOString(),
        validators: {
          agencyCounsellor: {
            firstname: "Counsellor Firstname",
            lastname: "Counsellor Lastname",
          },
        },
      },
      expectedDomainTopic: "ConventionAcceptedByCounsellor",
      allowedMagicLinkRoles: ["counsellor"],
      allowedInclusionConnectedUsers: ["icUserWithRoleCounsellor"],
      allowedInitialStatuses: ["IN_REVIEW"],
    });
  });

  describe("* -> ACCEPTED_BY_VALIDATOR transition", () => {
    const validationDate = new Date("2022-01-01T12:00:00.000");
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "ACCEPTED_BY_VALIDATOR",
        conventionId: originalConventionId,
        firstname: "Validator Firstname",
        lastname: "Validator Lastname",
      },
      expectedDomainTopic: "ConventionAcceptedByValidator",
      allowedMagicLinkRoles: ["validator"],
      allowedInclusionConnectedUsers: ["icUserWithRoleValidator"],
      allowedInitialStatuses: ["IN_REVIEW", "ACCEPTED_BY_COUNSELLOR"],
      updatedFields: {
        dateValidation: validationDate.toISOString(),
        validators: {
          agencyValidator: {
            firstname: "Validator Firstname",
            lastname: "Validator Lastname",
          },
        },
      },
      nextDate: validationDate,
    });

    describe("When agency have two steps validation", () => {
      testForAllRolesAndInitialStatusCases({
        updateStatusParams: {
          status: "ACCEPTED_BY_VALIDATOR",
          conventionId: conventionWithAgencyTwoStepsValidationId,
          firstname: "Validator Firstname",
          lastname: "Validator Lastname",
        },
        expectedDomainTopic: "ConventionAcceptedByValidator",
        allowedMagicLinkRoles: ["validator"],
        allowedInclusionConnectedUsers: ["icUserWithRoleValidator"],
        allowedInitialStatuses: ["ACCEPTED_BY_COUNSELLOR"],
        updatedFields: {
          dateValidation: validationDate.toISOString(),
          validators: {
            agencyValidator: {
              firstname: "Validator Firstname",
              lastname: "Validator Lastname",
            },
          },
        },
        nextDate: validationDate,
      });
    });
  });

  describe("* -> REJECTED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "REJECTED",
        statusJustification: "my rejection justification",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ConventionRejected",
      updatedFields: { statusJustification: "my rejection justification" },
      allowedMagicLinkRoles: ["backOffice", "validator", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleCounsellor",
      ],
      allowedInitialStatuses: [
        "PARTIALLY_SIGNED",
        "READY_TO_SIGN",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });
  });

  describe("* -> CANCELLED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "CANCELLED",
        statusJustification: "Cancelled justification",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ConventionCancelled",
      updatedFields: { statusJustification: "Cancelled justification" },
      allowedMagicLinkRoles: ["validator", "backOffice"],
      allowedInclusionConnectedUsers: ["icUserWithRoleValidator"],
      allowedInitialStatuses: ["ACCEPTED_BY_VALIDATOR"],
    });
  });

  describe("* -> DEPRECATED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "DEPRECATED",
        statusJustification: "my deprecation justification",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ConventionDeprecated",
      updatedFields: { statusJustification: "my deprecation justification" },
      allowedMagicLinkRoles: ["backOffice", "validator", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleCounsellor",
        "icUserWithRoleValidator",
      ],
      allowedInitialStatuses: [
        "PARTIALLY_SIGNED",
        "READY_TO_SIGN",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
        "DRAFT",
      ],
    });
  });

  it("fails for unknown convention ids", async () => {
    const missingConventionId: ConventionId =
      "add5c20e-6dd2-45af-affe-000000000000";

    const { updateConventionStatusUseCase, conventionRepository, timeGateway } =
      await setupInitialState({
        initialStatus: "IN_REVIEW",
        withIcUser: false,
        conventionId: missingConventionId,
      });

    await expectPromiseToFailWithError(
      executeUpdateConventionStatusUseCase({
        jwtPayload: createConventionMagicLinkPayload({
          id: missingConventionId,
          email: "test@test.fr",
          role: "validator",
          now: timeGateway.now(),
        }),
        updateStatusParams: {
          status: "ACCEPTED_BY_VALIDATOR",
          conventionId: missingConventionId,
          firstname: "Validator Firstname",
          lastname: "Validator Lastname",
        },
        updateConventionStatusUseCase,
        conventionRepository,
      }),
      new NotFoundError(conventionMissingMessage(missingConventionId)),
    );
  });
});
