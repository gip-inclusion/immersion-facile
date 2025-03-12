import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  type ConventionId,
  InclusionConnectedUserBuilder,
  createConventionMagicLinkPayload,
  errors,
  expectObjectInArrayToMatch,
  expectObjectsToMatch,
  expectPromiseToFailWithError,
  validSignatoryRoles,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UpdateConventionStatus } from "./UpdateConventionStatus";
import {
  acceptStatusTransitionTests,
  conventionWithAgencyOneStepValidationId,
  conventionWithAgencyTwoStepsValidationId,
  executeUpdateConventionStatusUseCase,
  rejectStatusTransitionTests,
  setupInitialState,
} from "./UpdateConventionStatus.testHelpers";

describe("UpdateConventionStatus", () => {
  describe("* -> DRAFT transition", () => {
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "DRAFT",
        statusJustification: "test justification",
        conventionId: conventionWithAgencyOneStepValidationId,
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
        "back-office",
      ],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleEstablishmentRepresentative",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
      ],
      allowedInitialStatuses: [
        "READY_TO_SIGN",
        "PARTIALLY_SIGNED",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });

    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "DRAFT",
        statusJustification: "test justification",
        conventionId: conventionWithAgencyTwoStepsValidationId,
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
        "back-office",
      ],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleCounsellor",
        "icUserWithRoleValidator",
        "icUserWithRoleEstablishmentRepresentative",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
      ],
      allowedInitialStatuses: [
        "READY_TO_SIGN",
        "PARTIALLY_SIGNED",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });

    rejectStatusTransitionTests({
      updateStatusParams: {
        status: "DRAFT",
        statusJustification: "test justification",
        conventionId: conventionWithAgencyOneStepValidationId,
        modifierRole: "beneficiary",
      },
      allowedMagicLinkRoles: [
        "beneficiary",
        "establishment-representative",
        "beneficiary-representative",
        "beneficiary-current-employer",
        "counsellor",
        "validator",
        "back-office",
      ],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleCounsellor",
        "icUserWithRoleValidator",
        "icUserWithRoleEstablishmentRepresentative",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
      ],
      allowedInitialStatuses: [
        "READY_TO_SIGN",
        "PARTIALLY_SIGNED",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });

    describe("standalone tests", () => {
      let uow: InMemoryUnitOfWork;
      let updateConventionStatusUseCase: UpdateConventionStatus;

      beforeEach(() => {
        ({ uow, updateConventionStatusUseCase } =
          prepareUseCaseForStandAloneTests());
      });

      it("Accept from role establishment-representative when convention is requested to be modified for the second time", async () => {
        const validator = new InclusionConnectedUserBuilder()
          .withId("validator")
          .withEmail("validator@email.com")
          .build();
        const agency = toAgencyWithRights(new AgencyDtoBuilder().build(), {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        });

        const initialConvention = new ConventionDtoBuilder()
          .withId(conventionWithAgencyOneStepValidationId)
          .withStatus("READY_TO_SIGN")
          .withEstablishmentRepresentativeEmail("establishmentrep@email.com")
          .withAgencyId(agency.id)
          .withInternshipKind("mini-stage-cci")
          .withBeneficiaryRepresentative({
            role: "beneficiary-representative",
            email: "benef-representative@mail.com",
            firstName: "Bruce",
            lastName: "Wayne",
            phone: "#33112233445",
            signedAt: undefined,
          })
          .build();

        const establishmentRepresentativeJwtPayload =
          createConventionMagicLinkPayload({
            id: conventionWithAgencyOneStepValidationId,
            role: "establishment-representative",
            email: "establishment-representative@mail.com",
            now: new Date(),
          });

        await uow.agencyRepository.insert(agency);
        await uow.conventionRepository.save(initialConvention);
        uow.userRepository.users = [validator];

        await updateConventionStatusUseCase.execute(
          {
            status: "DRAFT",
            statusJustification: "first modification",
            modifierRole: "establishment-representative",
            conventionId: conventionWithAgencyOneStepValidationId,
          },
          establishmentRepresentativeJwtPayload,
        );

        const updatedConventionAfterFirstModificationRequest =
          await uow.conventionRepository.getById(initialConvention.id);

        const signedConvention = new ConventionDtoBuilder(
          updatedConventionAfterFirstModificationRequest,
        )
          .withBeneficiarySignedAt(new Date())
          .withBeneficiaryRepresentativeSignedAt(new Date())
          .withStatus("PARTIALLY_SIGNED")
          .build();
        await uow.conventionRepository.update(signedConvention);

        await updateConventionStatusUseCase.execute(
          {
            status: "DRAFT",
            statusJustification: "second modification",
            modifierRole: "establishment-representative",
            conventionId: conventionWithAgencyOneStepValidationId,
          },
          establishmentRepresentativeJwtPayload,
        );

        const updatedConventionAfterSecondModificationRequest =
          await uow.conventionRepository.getById(initialConvention.id);

        expect(
          updatedConventionAfterSecondModificationRequest.signatories
            .beneficiary.signedAt,
        ).toBeUndefined();
      });

      it("removes date approval when going to status DRAFT", async () => {
        const user = new InclusionConnectedUserBuilder()
          .withEmail("validator@mail.com")
          .buildUser();
        const agency = toAgencyWithRights(new AgencyDtoBuilder().build(), {
          [user.id]: { roles: ["validator"], isNotifiedByEmail: true },
        });
        const dateApproval = new Date("2024-04-29").toISOString();
        const convention = new ConventionDtoBuilder()
          .withStatus("IN_REVIEW")
          .withAgencyId(agency.id)
          .withDateApproval(dateApproval)
          .build();

        uow.userRepository.users = [user];
        await uow.agencyRepository.insert(agency);
        uow.conventionRepository.setConventions([convention]);

        const validatorJwtPayload = createConventionMagicLinkPayload({
          id: convention.id,
          role: "validator",
          email: user.email,
          now: new Date(),
        });

        await updateConventionStatusUseCase.execute(
          {
            status: "DRAFT",
            statusJustification: "Ca va pas",
            conventionId: convention.id,
            modifierRole: "validator",
          },
          validatorJwtPayload,
        );

        expectObjectInArrayToMatch(uow.conventionRepository.conventions, [
          {
            status: "DRAFT",
            dateApproval: undefined,
          },
        ]);
      });
    });

    it("ConventionRequiresModification event only has the role of the user that requested the change", async () => {
      const uow = createInMemoryUow();

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
      agencyRepository.agencies = [toAgencyWithRights(agency)];

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

      expect(uow.outboxRepository.events).toHaveLength(1);

      expectObjectsToMatch(
        uow.outboxRepository.events[0],
        createNewEvent({
          topic: "ConventionRequiresModification",
          payload: {
            convention,
            justification: "because",
            requesterRole,
            modifierRole: "beneficiary",
            triggeredBy: {
              kind: "convention-magic-link",
              role: requesterRole,
            },
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

      await expectPromiseToFailWithError(
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
        errors.agency.notFound({ agencyId: agency.id }),
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

      uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

      const conventionBuilder = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(conventionId)
        .withAgencyId(agency.id)
        .build();

      await conventionRepository.save(conventionBuilder);

      await expectPromiseToFailWithError(
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
        errors.agency.emailNotFound({ agencyId: agency.id }),
      );
    });
  });

  describe("* -> READY_TO_SIGN transition", () => {
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "READY_TO_SIGN",
        conventionId: conventionWithAgencyOneStepValidationId,
      },
      expectedDomainTopic: null,
      allowedMagicLinkRoles: validSignatoryRoles,
      allowedInclusionConnectedUsers: [
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: ["DRAFT"],
    });
    rejectStatusTransitionTests({
      updateStatusParams: {
        status: "READY_TO_SIGN",
        conventionId: conventionWithAgencyOneStepValidationId,
      },
      allowedMagicLinkRoles: validSignatoryRoles,
      allowedInclusionConnectedUsers: [
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: ["DRAFT"],
    });
  });

  describe("* -> PARTIALLY_SIGNED transition", () => {
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "PARTIALLY_SIGNED",
        conventionId: conventionWithAgencyOneStepValidationId,
      },
      expectedDomainTopic: "ConventionPartiallySigned",
      allowedMagicLinkRoles: validSignatoryRoles,
      allowedInclusionConnectedUsers: [
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: ["READY_TO_SIGN", "PARTIALLY_SIGNED"],
    });
    rejectStatusTransitionTests({
      updateStatusParams: {
        status: "PARTIALLY_SIGNED",
        conventionId: conventionWithAgencyOneStepValidationId,
      },
      allowedMagicLinkRoles: validSignatoryRoles,
      allowedInclusionConnectedUsers: [
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: ["READY_TO_SIGN", "PARTIALLY_SIGNED"],
    });
  });

  describe("* -> IN_REVIEW transition", () => {
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "IN_REVIEW",
        conventionId: conventionWithAgencyOneStepValidationId,
      },
      expectedDomainTopic: "ConventionFullySigned",
      allowedMagicLinkRoles: validSignatoryRoles,
      allowedInclusionConnectedUsers: [
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: ["PARTIALLY_SIGNED"],
    });
    rejectStatusTransitionTests({
      updateStatusParams: {
        status: "IN_REVIEW",
        conventionId: conventionWithAgencyOneStepValidationId,
      },
      allowedMagicLinkRoles: validSignatoryRoles,
      allowedInclusionConnectedUsers: [
        "icUserWithRoleEstablishmentRepresentative",
      ],
      allowedInitialStatuses: ["PARTIALLY_SIGNED"],
    });
  });

  describe("* -> ACCEPTED_BY_COUNSELLOR transition", () => {
    const dateApproval = new Date("2021-09-01T10:10:00.000Z");
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "ACCEPTED_BY_COUNSELLOR",
        conventionId: conventionWithAgencyTwoStepsValidationId,
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
    rejectStatusTransitionTests({
      updateStatusParams: {
        status: "ACCEPTED_BY_COUNSELLOR",
        conventionId: conventionWithAgencyOneStepValidationId,
        firstname: "Counsellor Firstname",
        lastname: "Counsellor Lastname",
      },
      allowedMagicLinkRoles: ["counsellor"],
      allowedInclusionConnectedUsers: ["icUserWithRoleCounsellor"],
      allowedInitialStatuses: ["IN_REVIEW"],
    });
  });

  describe("* -> ACCEPTED_BY_VALIDATOR transition", () => {
    const validationDate = new Date("2022-01-01T12:00:00.000");
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "ACCEPTED_BY_VALIDATOR",
        conventionId: conventionWithAgencyOneStepValidationId,
        firstname: "Validator Firstname",
        lastname: "Validator Lastname",
      },
      expectedDomainTopic: "ConventionAcceptedByValidator",
      allowedMagicLinkRoles: ["validator"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleBackofficeAdminAndValidator",
      ],
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
    rejectStatusTransitionTests({
      updateStatusParams: {
        status: "ACCEPTED_BY_VALIDATOR",
        conventionId: conventionWithAgencyOneStepValidationId,
        firstname: "Validator Firstname",
        lastname: "Validator Lastname",
      },
      allowedMagicLinkRoles: ["validator"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleBackofficeAdminAndValidator",
      ],
      allowedInitialStatuses: ["IN_REVIEW", "ACCEPTED_BY_COUNSELLOR"],
    });

    describe("When agency have two steps validation", () => {
      acceptStatusTransitionTests({
        updateStatusParams: {
          status: "ACCEPTED_BY_VALIDATOR",
          conventionId: conventionWithAgencyTwoStepsValidationId,
          firstname: "Validator Firstname",
          lastname: "Validator Lastname",
        },
        expectedDomainTopic: "ConventionAcceptedByValidator",
        allowedMagicLinkRoles: ["validator"],
        allowedInclusionConnectedUsers: [
          "icUserWithRoleValidator",
          "icUserWithRoleBackofficeAdminAndValidator",
        ],
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

      it("keeps date approval when going to status ACCEPTED_BY_VALIDATOR", async () => {
        const { uow, updateConventionStatusUseCase } =
          prepareUseCaseForStandAloneTests();
        const user = new InclusionConnectedUserBuilder()
          .withEmail("validator@mail.com")
          .buildUser();
        const agency = toAgencyWithRights(new AgencyDtoBuilder().build(), {
          [user.id]: { roles: ["validator"], isNotifiedByEmail: true },
        });
        const dateApproval = new Date("2024-04-29").toISOString();
        const convention = new ConventionDtoBuilder()
          .withStatus("ACCEPTED_BY_COUNSELLOR")
          .withAgencyId(agency.id)
          .withDateApproval(dateApproval)
          .build();

        uow.userRepository.users = [user];
        await uow.agencyRepository.insert(agency);
        uow.conventionRepository.setConventions([convention]);

        const validatorJwtPayload = createConventionMagicLinkPayload({
          id: convention.id,
          role: "validator",
          email: user.email,
          now: new Date(),
        });

        await updateConventionStatusUseCase.execute(
          {
            status: "ACCEPTED_BY_VALIDATOR",
            conventionId: convention.id,
            firstname: "Joe",
            lastname: "Validator",
          },
          validatorJwtPayload,
        );

        expectObjectInArrayToMatch(uow.conventionRepository.conventions, [
          {
            status: "ACCEPTED_BY_VALIDATOR",
            dateApproval,
          },
        ]);
      });
    });
  });

  describe("* -> REJECTED transition", () => {
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "REJECTED",
        statusJustification: "my rejection justification",
        conventionId: conventionWithAgencyOneStepValidationId,
      },
      expectedDomainTopic: "ConventionRejected",
      updatedFields: { statusJustification: "my rejection justification" },
      allowedMagicLinkRoles: ["back-office", "validator", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
      ],
      allowedInitialStatuses: [
        "PARTIALLY_SIGNED",
        "READY_TO_SIGN",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "REJECTED",
        statusJustification: "my rejection justification",
        conventionId: conventionWithAgencyTwoStepsValidationId,
      },
      expectedDomainTopic: "ConventionRejected",
      updatedFields: { statusJustification: "my rejection justification" },
      allowedMagicLinkRoles: ["back-office", "validator", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleCounsellor",
        "icUserWithRoleValidator",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
      ],
      allowedInitialStatuses: [
        "PARTIALLY_SIGNED",
        "READY_TO_SIGN",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });

    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "REJECTED",
        statusJustification: "my rejection justification",
        conventionId: conventionWithAgencyTwoStepsValidationId,
      },
      expectedDomainTopic: "ConventionRejected",
      updatedFields: { statusJustification: "my rejection justification" },
      allowedMagicLinkRoles: ["back-office", "validator", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleCounsellor",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
      ],
      allowedInitialStatuses: [
        "PARTIALLY_SIGNED",
        "READY_TO_SIGN",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });
    rejectStatusTransitionTests({
      updateStatusParams: {
        status: "REJECTED",
        statusJustification: "my rejection justification",
        conventionId: conventionWithAgencyOneStepValidationId,
      },
      allowedMagicLinkRoles: ["back-office", "validator", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleCounsellor",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
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
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "CANCELLED",
        statusJustification: "Cancelled justification",
        conventionId: conventionWithAgencyTwoStepsValidationId,
      },
      expectedDomainTopic: "ConventionCancelled",
      updatedFields: { statusJustification: "Cancelled justification" },
      allowedMagicLinkRoles: ["validator", "back-office", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
        "icUserWithRoleCounsellor",
      ],
      allowedInitialStatuses: ["ACCEPTED_BY_VALIDATOR"],
    });
    rejectStatusTransitionTests({
      updateStatusParams: {
        status: "CANCELLED",
        statusJustification: "Cancelled justification",
        conventionId: conventionWithAgencyTwoStepsValidationId,
      },
      allowedMagicLinkRoles: ["validator", "back-office", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
        "icUserWithRoleCounsellor",
      ],
      allowedInitialStatuses: ["ACCEPTED_BY_VALIDATOR"],
    });
  });

  describe("* -> DEPRECATED transition", () => {
    acceptStatusTransitionTests({
      updateStatusParams: {
        status: "DEPRECATED",
        statusJustification: "my deprecation justification",
        conventionId: conventionWithAgencyTwoStepsValidationId,
      },
      expectedDomainTopic: "ConventionDeprecated",
      updatedFields: { statusJustification: "my deprecation justification" },
      allowedMagicLinkRoles: ["back-office", "validator", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleCounsellor",
        "icUserWithRoleValidator",
        "icUserWithRoleBackofficeAdmin",
        "icUserWithRoleBackofficeAdminAndValidator",
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
      errors.convention.notFound({
        conventionId: missingConventionId,
      }),
    );
  });
});

const prepareUseCaseForStandAloneTests = () => {
  const uow = createInMemoryUow();
  const timeGateway = new CustomTimeGateway();
  const createNewEvent = makeCreateNewEvent({
    timeGateway,
    uuidGenerator: new TestUuidGenerator(),
  });
  const updateConventionStatusUseCase = new UpdateConventionStatus(
    new InMemoryUowPerformer(uow),
    createNewEvent,
    timeGateway,
  );
  return {
    uow,
    updateConventionStatusUseCase,
  };
};
