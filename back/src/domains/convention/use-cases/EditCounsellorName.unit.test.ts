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
  errors,
  expectArraysToMatch,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { createConventionMagicLinkPayload } from "../../../utils/jwt";
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
  type EditCounsellorName,
  makeEditCounsellorName,
} from "./EditCounsellorName";

describe("EditCounsellorName", () => {
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

  const preValidatedConvention = new ConventionDtoBuilder(convention)
    .withAgencyId(agencyWithRefersTo.id)
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

  let createNewEvent: CreateNewEvent;
  let uow: InMemoryUnitOfWork;
  let usecase: EditCounsellorName;
  let timeGateway: TimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    createNewEvent = makeCreateNewEvent({
      timeGateway: timeGateway,
      uuidGenerator: new TestUuidGenerator(),
    });

    usecase = makeEditCounsellorName({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent,
      },
    });
  });

  describe("Wrong paths", () => {
    it.each([
      "REJECTED",
      "CANCELLLED",
      "DEPRECATED",
      "ACCEPTED_BY_COUNSELLOR",
      "ACCEPTED_BY_VALIDATOR",
    ] as ConventionStatus[])(
      "should throw an error if convention status %s does not allow counsellor names to be edited",
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
              firstname: "ali",
              lastname: "baba",
            },
            validatorJwtPayload,
          ),
          errors.convention.editCounsellorNameNotAllowedForStatus({
            status,
          }),
        );
        expectObjectInArrayToMatch(uow.outboxRepository.events, []);
      },
    );

    it("throw an error if convention is not found", async () => {
      await expectPromiseToFailWithError(
        usecase.execute(
          {
            conventionId,
            firstname: "ali",
            lastname: "baba",
          },
          validatorJwtPayload,
        ),
        errors.convention.notFound({
          conventionId,
        }),
      );
    });

    describe("with connected user", () => {
      it("throws not found if connected user does not exist", async () => {
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
              firstname: "ali",
              lastname: "baba",
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
              firstname: "ali",
              lastname: "baba",
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
                firstname: "ali",
                lastname: "baba",
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

      it("if agencyWithRefersTo, throws an error if validator attempts to edit counsellor's names", async () => {
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
              firstname: "ali",
              lastname: "baba",
            },
            connectedUserPayload,
          ),
          errors.convention.unsupportedRole({ role: "validator" }),
        );
      });
    });

    describe("with convention jwt payload", () => {
      it("throws bad request if requested convention does not match the one in jwt", async () => {
        const requestedConventionId = "1dd5c20e-6dd2-45af-affe-927358005250";

        await expectPromiseToFailWithError(
          usecase.execute(
            {
              conventionId: requestedConventionId,
              firstname: "ali",
              lastname: "baba",
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
                firstname: "ali",
                lastname: "baba",
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
              firstname: "ali",
              lastname: "baba",
            },
            jwtPayload,
          ),
          errors.convention.unsupportedRole({ role: "validator" }),
        );
      });
    });
  });

  describe("Right paths: edit counsellor names on convention", () => {
    describe("with connected user", () => {
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
              firstname: "ali",
              lastname: "baba",
            },
            connectedUserPayload,
          );

          const updatedConvention = await uow.conventionRepository.getById(
            convention.id,
          );

          expectToEqual(uow.conventionRepository.conventions, [
            {
              ...convention,
              agencyReferent: {
                firstname: "ali",
                lastname: "baba",
              },
            },
          ]);
          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionCounsellorNameEdited",
              payload: {
                conventionId: updatedConvention.id,
                triggeredBy: {
                  kind: "inclusion-connected",
                  userId: user.id,
                },
                firstname: "ali",
                lastname: "baba",
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
              firstname: "ali",
              lastname: "baba",
            },
            connectedUserPayload,
          );

          const updatedConvention = await uow.conventionRepository.getById(
            initialConvention.id,
          );

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionCounsellorNameEdited",
              payload: {
                conventionId: updatedConvention.id,
                firstname: "ali",
                lastname: "baba",
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
            firstname: "ali",
            lastname: "baba",
          },
          backofficeAdminPayload,
        );

        const updatedConvention = await uow.conventionRepository.getById(
          conventionWithAgencyRefersTo.id,
        );

        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionCounsellorNameEdited",
            payload: {
              conventionId: updatedConvention.id,
              firstname: "ali",
              lastname: "baba",
              triggeredBy: {
                kind: "inclusion-connected",
                userId: backofficeAdmin.id,
              },
            },
          },
        ]);
      });

      it("counsellor of an agency with refersTo can edit counsellor name", async () => {
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
            firstname: "ali",
            lastname: "baba",
          },
          counsellorPayload,
        );

        const updatedConvention = await uow.conventionRepository.getById(
          conventionWithAgencyRefersTo.id,
        );

        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionCounsellorNameEdited",
            payload: {
              conventionId: updatedConvention.id,
              firstname: "ali",
              lastname: "baba",
              triggeredBy: {
                kind: "inclusion-connected",
                userId: counsellor.id,
              },
            },
          },
        ]);
      });
    });

    describe("with convention jwt payload", () => {
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
              firstname: "ali",
              lastname: "baba",
            },
            jwtPayload,
          );

          const updatedConvention = await uow.conventionRepository.getById(
            convention.id,
          );

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionCounsellorNameEdited",
              payload: {
                conventionId: updatedConvention.id,
                firstname: "ali",
                lastname: "baba",
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
              firstname: "ali",
              lastname: "baba",
            },
            validatorJwtPayload,
          );

          const updatedConvention = await uow.conventionRepository.getById(
            initialConvention.id,
          );

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionCounsellorNameEdited",
              payload: {
                conventionId: updatedConvention.id,
                firstname: "ali",
                lastname: "baba",
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
            firstname: "ali",
            lastname: "baba",
          },
          backofficeAdminPayload,
        );

        const updatedConvention = await uow.conventionRepository.getById(
          conventionWithAgencyRefersTo.id,
        );

        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionCounsellorNameEdited",
            payload: {
              conventionId: updatedConvention.id,
              firstname: "ali",
              lastname: "baba",
              triggeredBy: {
                kind: "convention-magic-link",
                role: "back-office",
              },
            },
          },
        ]);
      });

      it("counsellor of an agency with refersTo can edit counsellor name", async () => {
        const counsellorPayload = createConventionMagicLinkPayload({
          id: conventionId,
          role: "counsellor",
          email: notConnectedUser.email,
          now: new Date(),
        });
        const conventionWithAgencyRefersTo = new ConventionDtoBuilder(
          convention,
        )
          .withAgencyId(agencyWithRefersTo.id)
          .build();
        uow.conventionRepository.setConventions([conventionWithAgencyRefersTo]);
        uow.userRepository.users = [notConnectedUser];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(otherAgency, {}),
          toAgencyWithRights(agencyWithRefersTo, {
            [notConnectedUser.id]: {
              roles: ["counsellor"],
              isNotifiedByEmail: false,
            },
          }),
        ];

        await usecase.execute(
          {
            conventionId: conventionWithAgencyRefersTo.id,
            firstname: "ali",
            lastname: "baba",
          },
          counsellorPayload,
        );

        const updatedConvention = await uow.conventionRepository.getById(
          conventionWithAgencyRefersTo.id,
        );

        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionCounsellorNameEdited",
            payload: {
              conventionId: updatedConvention.id,
              firstname: "ali",
              lastname: "baba",
              triggeredBy: {
                kind: "convention-magic-link",
                role: "counsellor",
              },
            },
          },
        ]);
      });
    });
  });
});
