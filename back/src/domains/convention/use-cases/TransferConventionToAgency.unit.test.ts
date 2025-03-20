import type {
  AgencyRole,
  ConventionStatus,
  InclusionConnectDomainJwtPayload,
  Role,
} from "shared";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  type InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  UserBuilder,
  conventionStatusesWithoutJustificationNorValidator,
  createConventionMagicLinkPayload,
  errors,
  expectArraysToMatch,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type TransferConventionToAgency,
  makeTransferConventionToAgency,
} from "./TransferConventionToAgency";

const conventionId = "add5c20e-6dd2-45af-affe-927358005251";

const otherAgency = new AgencyDtoBuilder().withId("other-agency-id").build();

const agency = new AgencyDtoBuilder().build();

const agencyWithRefersTo = new AgencyDtoBuilder()
  .withId("agency-with-refers-to")
  .withRefersToAgencyInfo({
    refersToAgencyId: agency.id,
    refersToAgencyName: agency.name,
  })
  .build();

const convention = new ConventionDtoBuilder()
  .withId(conventionId)
  .withStatus("READY_TO_SIGN")
  .withAgencyId(agency.id)
  .signedByEstablishmentRepresentative(undefined)
  .signedByBeneficiary(undefined)
  .withBeneficiarySignedAt(undefined)
  .build();

const notConnectedUser = new UserBuilder()
  .withEmail("validator@mail.com")
  .build();

const validatorJwtPayload = createConventionMagicLinkPayload({
  id: conventionId,
  role: "validator",
  email: notConnectedUser.email,
  now: new Date(),
});

const connectedUserPayload: InclusionConnectDomainJwtPayload = {
  userId: "bcc5c20e-6dd2-45cf-affe-927358005262",
};

const connectedUser = new InclusionConnectedUserBuilder()
  .withId(connectedUserPayload.userId)
  .build();

describe("TransferConventionToAgency", () => {
  let createNewEvent: CreateNewEvent;
  let uow: InMemoryUnitOfWork;
  let usecase: TransferConventionToAgency;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    createNewEvent = makeCreateNewEvent({
      timeGateway: timeGateway,
      uuidGenerator: new TestUuidGenerator(),
    });

    usecase = makeTransferConventionToAgency({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent,
      },
    });
  });

  describe("Wrong paths", () => {
    it.each([
      "DRAFT",
      "REJECTED",
      "CANCELLLED",
      "DEPRECATED",
      "ACCEPTED_BY_COUNSELLOR",
      "ACCEPTED_BY_VALIDATOR",
    ] as ConventionStatus[])(
      "should throw an error if convention status %s does not allow convention to be transfer",
      async (status) => {
        const conventionWithStatus = new ConventionDtoBuilder(convention)
          .withStatus(status)
          .build();
        uow.userRepository.users = [notConnectedUser];
        uow.conventionRepository.setConventions([conventionWithStatus]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notConnectedUser.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
          toAgencyWithRights(otherAgency, {}),
        ];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: convention.id,
              agencyId: otherAgency.id,
              justification: "test",
            },
            validatorJwtPayload,
          ),
          errors.convention.transferNotAllowedForStatus({
            status,
          }),
        );

        expectObjectInArrayToMatch(
          uow.notificationRepository.notifications,
          [],
        );
        expectObjectInArrayToMatch(uow.outboxRepository.events, []);
      },
    );

    it("throw an error if convention is not found", async () => {
      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            agencyId: otherAgency.id,
            justification: "test",
          },
          validatorJwtPayload,
        ),
        errors.convention.notFound({
          conventionId,
        }),
      );
    });

    it("throw an error if agency is not found", async () => {
      uow.conventionRepository.setConventions([convention]);
      uow.agencyRepository.agencies = [toAgencyWithRights(agency, {})];
      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            agencyId: otherAgency.id,
            justification: "test",
          },
          validatorJwtPayload,
        ),
        errors.agency.notFound({
          agencyId: otherAgency.id,
        }),
      );
    });

    describe("connected user", () => {
      it("throws not found if connected user id does not exist", async () => {
        const unexistingUserPayload: InclusionConnectDomainJwtPayload = {
          userId: "bcc5c20e-6dd2-45cf-affe-927358005267",
        };
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {}),
          toAgencyWithRights(otherAgency, {}),
        ];
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              agencyId: otherAgency.id,
              justification: "test",
            },
            unexistingUserPayload,
          ),
          errors.user.notFound(unexistingUserPayload),
        );
      });

      it("throws unauthorized if user has no rights on agency", async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {}),
          toAgencyWithRights(otherAgency, {}),
        ];
        uow.userRepository.users = [connectedUser];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId,
              agencyId: otherAgency.id,
              justification: "test",
            },
            connectedUserPayload,
          ),
          errors.user.noRightsOnAgency({
            userId: connectedUserPayload.userId,
            agencyId: convention.agencyId,
          }),
        );
      });

      it.each(["agency-viewer", "agency-admin", "to-review"] as AgencyRole[])(
        "throws unauthorized if user has not enough rights on agency",
        async (role) => {
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [connectedUserPayload.userId]: {
                roles: [role],
                isNotifiedByEmail: false,
              },
            }),
            toAgencyWithRights(otherAgency, {}),
          ];
          uow.userRepository.users = [connectedUser];

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId,
                agencyId: otherAgency.id,
                justification: "test",
              },
              connectedUserPayload,
            ),
            errors.user.notEnoughRightOnAgency({
              userId: connectedUserPayload.userId,
              agencyId: convention.agencyId,
            }),
          );
        },
      );

      it("if agencyWithRefersTo, throws an error if validator attempts to change agency", async () => {
        const preValidatedConvention = new ConventionDtoBuilder(convention)
          .withAgencyId(agencyWithRefersTo.id)
          .build();
        uow.conventionRepository.setConventions([preValidatedConvention]);
        uow.userRepository.users = [connectedUser];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [connectedUserPayload.userId]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
          toAgencyWithRights(agencyWithRefersTo, {
            [connectedUserPayload.userId]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
          toAgencyWithRights(otherAgency, {}),
        ];

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: preValidatedConvention.id,
              agencyId: otherAgency.id,
              justification: "test",
            },
            connectedUserPayload,
          ),
          errors.convention.unsupportedRole({ role: "validator" }),
        );
      });
    });

    describe("not connected user", () => {
      it("throws bad request if requested convention does not match the one in jwt", async () => {
        const requestedConventionId = "1dd5c20e-6dd2-45af-affe-927358005250";

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: requestedConventionId,
              agencyId: otherAgency.id,
              justification: "test",
            },
            validatorJwtPayload,
          ),
          errors.convention.forbiddenMissingRights({
            conventionId: requestedConventionId,
          }),
        );
      });

      it.each(["to-review", "agency-viewer", "agency-admin"] as AgencyRole[])(
        "throws bad request if unauthorized if user role is not allowed",
        async (role) => {
          uow.conventionRepository.setConventions([convention]);
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {}),
            toAgencyWithRights(otherAgency, {}),
          ];
          const jwtPayload = createConventionMagicLinkPayload({
            id: conventionId,
            role,
            email: notConnectedUser.email,
            now: new Date(),
          });

          await expectPromiseToFailWithError(
            usecase.execute(
              {
                conventionId,
                agencyId: otherAgency.id,
                justification: "test",
              },
              jwtPayload,
            ),
            errors.convention.unsupportedRole({
              role,
            }),
          );
        },
      );

      it("if agencyWithRefersTo, throws an error if validator attempts to change agency", async () => {
        const preValidatedConvention = new ConventionDtoBuilder(convention)
          .withAgencyId(agencyWithRefersTo.id)
          .build();
        uow.conventionRepository.setConventions([preValidatedConvention]);
        uow.userRepository.users = [notConnectedUser];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notConnectedUser.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
          toAgencyWithRights(agencyWithRefersTo, {
            [notConnectedUser.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
          toAgencyWithRights(otherAgency, {}),
        ];
        const jwtPayload = createConventionMagicLinkPayload({
          id: preValidatedConvention.id,
          role: "validator",
          email: notConnectedUser.email,
          now: new Date(),
        });

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: preValidatedConvention.id,
              agencyId: otherAgency.id,
              justification: "test",
            },
            jwtPayload,
          ),
          errors.convention.unsupportedRole({ role: "validator" }),
        );
      });
    });
  });

  describe("Right paths: transfer of convention", () => {
    describe("connected user", () => {
      it.each(["validator", "counsellor", "back-office"] as Role[])(
        "triggered by inclusion-connected user with role %s",
        async (role) => {
          const user: InclusionConnectedUser = {
            ...connectedUser,
            isBackofficeAdmin: role === "back-office",
          };
          uow.conventionRepository.setConventions([convention]);
          uow.userRepository.users = [user];

          uow.agencyRepository.agencies = [
            toAgencyWithRights(
              agency,
              role === "validator" || role === "counsellor"
                ? {
                    [user.id]: {
                      roles: [role],
                      isNotifiedByEmail: true,
                    },
                  }
                : {},
            ),
            toAgencyWithRights(otherAgency, {}),
          ];

          await usecase.execute(
            {
              conventionId,
              agencyId: otherAgency.id,
              justification: "change of agency",
            },
            connectedUserPayload,
          );

          const transferedConvention = await uow.conventionRepository.getById(
            convention.id,
          );

          expectToEqual(transferedConvention.agencyId, otherAgency.id);

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionTransferredToAgency",
              payload: {
                convention: transferedConvention,
                agencyId: otherAgency.id,
                justification: "change of agency",
                previousAgencyId: convention.agencyId,
                triggeredBy: {
                  kind: "inclusion-connected",
                  userId: user.id,
                },
              },
            },
          ]);
        },
      );

      it.each(conventionStatusesWithoutJustificationNorValidator)(
        "with status %s",
        async (status) => {
          const initialConvention = new ConventionDtoBuilder(convention)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([initialConvention]);
          uow.userRepository.users = [connectedUser];
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [connectedUser.id]: {
                roles: ["validator"],
                isNotifiedByEmail: true,
              },
            }),
            toAgencyWithRights(otherAgency, {}),
          ];

          await usecase.execute(
            {
              conventionId,
              agencyId: otherAgency.id,
              justification: "change of agency",
            },
            connectedUserPayload,
          );

          const transferedConvention = await uow.conventionRepository.getById(
            initialConvention.id,
          );

          expectToEqual(transferedConvention.agencyId, otherAgency.id);

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionTransferredToAgency",
              payload: {
                agencyId: otherAgency.id,
                convention: transferedConvention,
                justification: "change of agency",
                previousAgencyId: convention.agencyId,
                triggeredBy: {
                  kind: "inclusion-connected",
                  userId: connectedUser.id,
                },
              },
            },
          ]);
        },
      );

      it("triggered by backoffice admin for a convention with agency with refersTo", async () => {
        const backofficeAdmin = new InclusionConnectedUserBuilder()
          .withEmail("counsellor@mail.com")
          .withIsAdmin(true)
          .build();
        const backofficeAdminPayload: InclusionConnectDomainJwtPayload = {
          userId: backofficeAdmin.id,
        };
        const conventionWithAgencyRefersTo = new ConventionDtoBuilder(
          convention,
        )
          .withAgencyId(agencyWithRefersTo.id)
          .build();
        uow.conventionRepository.setConventions([conventionWithAgencyRefersTo]);
        uow.userRepository.users = [backofficeAdmin];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(otherAgency, {}),
          toAgencyWithRights(agencyWithRefersTo, {}),
        ];

        await usecase.execute(
          {
            conventionId: conventionWithAgencyRefersTo.id,
            agencyId: otherAgency.id,
            justification: "change of agency",
          },
          backofficeAdminPayload,
        );

        const transferedConvention = await uow.conventionRepository.getById(
          conventionWithAgencyRefersTo.id,
        );

        expectToEqual(transferedConvention.agencyId, otherAgency.id);
        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionTransferredToAgency",
            payload: {
              agencyId: otherAgency.id,
              convention: transferedConvention,
              justification: "change of agency",
              previousAgencyId: conventionWithAgencyRefersTo.agencyId,
              triggeredBy: {
                kind: "inclusion-connected",
                userId: backofficeAdmin.id,
              },
            },
          },
        ]);
      });

      it("counsellor of an agency with refersTo can transfer convention to agency", async () => {
        const counsellor = new UserBuilder()
          .withEmail("counsellor@mail.com")
          .build();
        const counsellorPayload: InclusionConnectDomainJwtPayload = {
          userId: counsellor.id,
        };
        const conventionWithAgencyRefersTo = new ConventionDtoBuilder(
          convention,
        )
          .withAgencyId(agencyWithRefersTo.id)
          .build();
        uow.conventionRepository.setConventions([conventionWithAgencyRefersTo]);
        uow.userRepository.users = [counsellor];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(otherAgency, {}),
          toAgencyWithRights(agencyWithRefersTo, {
            [counsellor.id]: {
              roles: ["counsellor"],
              isNotifiedByEmail: true,
            },
          }),
        ];

        await usecase.execute(
          {
            conventionId: conventionWithAgencyRefersTo.id,
            agencyId: otherAgency.id,
            justification: "change of agency",
          },
          counsellorPayload,
        );

        const transferedConvention = await uow.conventionRepository.getById(
          conventionWithAgencyRefersTo.id,
        );

        expectToEqual(transferedConvention.agencyId, otherAgency.id);
        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionTransferredToAgency",
            payload: {
              agencyId: otherAgency.id,
              convention: transferedConvention,
              justification: "change of agency",
              previousAgencyId: conventionWithAgencyRefersTo.agencyId,
              triggeredBy: {
                kind: "inclusion-connected",
                userId: counsellor.id,
              },
            },
          },
        ]);
      });
    });

    describe("not connected user", () => {
      it.each(["validator", "counsellor", "back-office"] as Role[])(
        "triggered by jwt role %s",
        async (role) => {
          uow.conventionRepository.setConventions([convention]);
          uow.userRepository.users = [notConnectedUser];

          uow.agencyRepository.agencies = [
            toAgencyWithRights(
              agency,
              role === "validator" || role === "counsellor"
                ? {
                    [notConnectedUser.id]: {
                      roles: [role],
                      isNotifiedByEmail: true,
                    },
                  }
                : {},
            ),
            toAgencyWithRights(otherAgency, {}),
          ];

          const jwtPayload = createConventionMagicLinkPayload({
            id: conventionId,
            role,
            email: notConnectedUser.email,
            now: new Date(),
          });

          await usecase.execute(
            {
              conventionId,
              agencyId: otherAgency.id,
              justification: "change of agency",
            },
            jwtPayload,
          );

          const transferedConvention = await uow.conventionRepository.getById(
            convention.id,
          );

          expectToEqual(transferedConvention.agencyId, otherAgency.id);

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionTransferredToAgency",
              payload: {
                convention: transferedConvention,
                agencyId: otherAgency.id,
                justification: "change of agency",
                previousAgencyId: convention.agencyId,
                triggeredBy: {
                  kind: "convention-magic-link",
                  role: jwtPayload.role,
                },
              },
            },
          ]);
        },
      );

      it.each(conventionStatusesWithoutJustificationNorValidator)(
        "with status %s",
        async (status) => {
          const initialConvention = new ConventionDtoBuilder(convention)
            .withStatus(status)
            .build();
          uow.conventionRepository.setConventions([initialConvention]);
          uow.userRepository.users = [notConnectedUser];
          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency, {
              [notConnectedUser.id]: {
                roles: ["validator"],
                isNotifiedByEmail: true,
              },
            }),
            toAgencyWithRights(otherAgency, {}),
          ];

          await usecase.execute(
            {
              conventionId,
              agencyId: otherAgency.id,
              justification: "change of agency",
            },
            validatorJwtPayload,
          );

          const transferedConvention = await uow.conventionRepository.getById(
            initialConvention.id,
          );

          expectToEqual(transferedConvention.agencyId, otherAgency.id);

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionTransferredToAgency",
              payload: {
                agencyId: otherAgency.id,
                convention: transferedConvention,
                justification: "change of agency",
                previousAgencyId: convention.agencyId,
                triggeredBy: {
                  kind: "convention-magic-link",
                  role: validatorJwtPayload.role,
                },
              },
            },
          ]);
        },
      );

      it("triggered by backoffice admin for a convention with agency with refersTo", async () => {
        const backofficeAdminPayload = createConventionMagicLinkPayload({
          id: conventionId,
          role: "back-office",
          email: notConnectedUser.email,
          now: new Date(),
        });
        const conventionWithAgencyRefersTo = new ConventionDtoBuilder(
          convention,
        )
          .withAgencyId(agencyWithRefersTo.id)
          .build();
        uow.conventionRepository.setConventions([conventionWithAgencyRefersTo]);
        uow.userRepository.users = [];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(otherAgency, {}),
          toAgencyWithRights(agencyWithRefersTo, {}),
        ];

        await usecase.execute(
          {
            conventionId: conventionWithAgencyRefersTo.id,
            agencyId: otherAgency.id,
            justification: "change of agency",
          },
          backofficeAdminPayload,
        );

        const transferedConvention = await uow.conventionRepository.getById(
          conventionWithAgencyRefersTo.id,
        );

        expectToEqual(transferedConvention.agencyId, otherAgency.id);

        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionTransferredToAgency",
            payload: {
              agencyId: otherAgency.id,
              convention: transferedConvention,
              justification: "change of agency",
              previousAgencyId: conventionWithAgencyRefersTo.agencyId,
              triggeredBy: {
                kind: "convention-magic-link",
                role: "back-office",
              },
            },
          },
        ]);
      });

      it("counsellor of an agency with refersTo can transfer convention to agency", async () => {
        const counsellorPayload = createConventionMagicLinkPayload({
          id: conventionId,
          role: "back-office",
          email: notConnectedUser.email,
          now: new Date(),
        });
        const conventionWithAgencyRefersTo = new ConventionDtoBuilder(
          convention,
        )
          .withAgencyId(agencyWithRefersTo.id)
          .build();
        uow.conventionRepository.setConventions([conventionWithAgencyRefersTo]);
        uow.userRepository.users = [];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(otherAgency, {}),
          toAgencyWithRights(agencyWithRefersTo, {}),
        ];

        await usecase.execute(
          {
            conventionId: conventionWithAgencyRefersTo.id,
            agencyId: otherAgency.id,
            justification: "change of agency",
          },
          counsellorPayload,
        );

        const transferedConvention = await uow.conventionRepository.getById(
          conventionWithAgencyRefersTo.id,
        );

        expectToEqual(transferedConvention.agencyId, otherAgency.id);

        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionTransferredToAgency",
            payload: {
              agencyId: otherAgency.id,
              convention: transferedConvention,
              justification: "change of agency",
              previousAgencyId: conventionWithAgencyRefersTo.agencyId,
              triggeredBy: {
                kind: "convention-magic-link",
                role: "back-office",
              },
            },
          },
        ]);
      });
    });
  });
});
