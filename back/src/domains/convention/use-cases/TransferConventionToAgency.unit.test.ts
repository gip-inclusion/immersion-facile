import {
  AgencyDtoBuilder,
  type AgencyRole,
  ConventionDtoBuilder,
  type ConventionStatus,
  type InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  UserBuilder,
  conventionStatusesWithoutJustificationNorValidator,
  createConventionMagicLinkPayload,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator, UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type TransferConventionToAgency,
  makeTransferConventionToAgency,
} from "./TransferConventionToAgency";
import { makeSaveNotificationAndRelatedEvent, type SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { DeterministShortLinkIdGeneratorGateway } from "../../core/short-link/adapters/short-link-generator-gateway/DeterministShortLinkIdGeneratorGateway";
import type { ShortLinkIdGeneratorGateway } from "../../core/short-link/ports/ShortLinkIdGeneratorGateway";

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
  let saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  let uow: InMemoryUnitOfWork;
  let usecase: TransferConventionToAgency;
  let timeGateway: TimeGateway;
  let shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway
  ;
  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    shortLinkIdGeneratorGateway = new DeterministShortLinkIdGeneratorGateway();
    saveNotificationAndRelatedEvent = makeSaveNotificationAndRelatedEvent(
      new UuidV4Generator(),
      timeGateway,
    );
    
    usecase = makeTransferConventionToAgency({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: { saveNotificationAndRelatedEvent, shortLinkIdGeneratorGateway },
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

    describe("specifique connected user", () => {
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

    describe("specific unconnected user", () => {
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

  describe("Right paths: transfer convention to agency", () => {
    // peut redemander un transfer et écrase la justification précédente
    // counseiller et valideur peuvent faire la demande
    // double étape de validation de la même agence

    it.each([conventionStatusesWithoutJustificationNorValidator[0]])(
      "and send notification emails to signatories",
      async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.userRepository.users = [notConnectedUser];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [notConnectedUser.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
          toAgencyWithRights(otherAgency, {})
        ];

        await usecase.execute(
          {
            conventionId,
            agencyId: otherAgency.id,
            justification: "change of agency",
          },
          validatorJwtPayload,
        );

        expect(uow.outboxRepository.events).toHaveLength(1);
        expect(uow.outboxRepository.events[0].topic).toBe("NotificationAdded");
      },
    );
  });
});
