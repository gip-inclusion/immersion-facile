import {
  AgencyDtoBuilder,
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
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type TransferConventionToAgency,
  makeTransferConventionToAgency,
} from "./TransferConventionToAgency";

const conventionId = "add5c20e-6dd2-45af-affe-927358005251";

const otherAgency = new AgencyDtoBuilder().withId("other-agency-id").build();

const agency = new AgencyDtoBuilder().build();

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

  beforeEach(() => {
    createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator: new TestUuidGenerator(),
    });
    uow = createInMemoryUow();
    usecase = makeTransferConventionToAgency({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: { createNewEvent },
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

      it("throws unauthorized if user has not enough rights on agency", async () => {
        uow.conventionRepository.setConventions([convention]);
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [connectedUserPayload.userId]: {
              roles: ["agency-viewer"],
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
    });
  });

  describe("Right paths", () => {
    it.each(conventionStatusesWithoutJustificationNorValidator)(
      "should transfer convention to agency",
      async () => {
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
