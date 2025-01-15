import { addMinutes, subHours } from "date-fns";
import subDays from "date-fns/subDays";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  InclusionConnectedUserBuilder,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import { makeCreateNewEvent } from "../../../core/events/ports/EventBus";
import { broadcastToFtServiceName } from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  BroadcastConventionAgain,
  makeBroadcastConventionAgain,
} from "./BroadcastConventionAgain";

describe("BroadcastConventionAgain", () => {
  const agency = new AgencyDtoBuilder()
    .withId("11111111-1111-4111-2222-111111111122")
    .build();
  const convention = new ConventionDtoBuilder()
    .withId("11111111-1111-4111-1111-111111111111")
    .withAgencyId(agency.id)
    .build();
  const adminUser = new InclusionConnectedUserBuilder()
    .withIsAdmin(true)
    .build();
  const userWithEnoughRights = new InclusionConnectedUserBuilder()
    .withIsAdmin(false)
    .withAgencyRights([
      {
        agency: toAgencyDtoForAgencyUsersAndAdmins(agency, []),
        roles: ["validator", "counsellor"],
        isNotifiedByEmail: true,
      },
    ])
    .build();

  let broadcastConventionAgain: BroadcastConventionAgain;
  let uow: InMemoryUnitOfWork;
  let timeGateway: TimeGateway;

  beforeEach(async () => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    broadcastConventionAgain = makeBroadcastConventionAgain({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent: makeCreateNewEvent({
          uuidGenerator: new TestUuidGenerator(),
          timeGateway,
        }),
        timeGateway: timeGateway,
      },
    });
    uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
    await uow.conventionRepository.save(convention);
  });

  describe("Wrong paths", () => {
    it("throws Forbidden if user doesn't have enough rights on convention", async () => {
      const user = new InclusionConnectedUserBuilder()
        .withIsAdmin(false)
        .build();
      uow.userRepository.users = [user];

      await expectPromiseToFailWithError(
        broadcastConventionAgain.execute({ conventionId: convention.id }, user),
        errors.user.forbidden({ userId: user.id }),
      );
    });

    it("throws notFound when convention is not found", async () => {
      const notFoundConventionId = "40400000-1111-4000-1111-000000000404";
      await expectPromiseToFailWithError(
        broadcastConventionAgain.execute(
          { conventionId: notFoundConventionId },
          adminUser,
        ),
        errors.convention.notFound({
          conventionId: notFoundConventionId,
        }),
      );
    });
  });

  describe("Right paths", () => {
    describe("when there is no previous broadcast", () => {
      it.each([adminUser, userWithEnoughRights])(
        "trigger ConventionBroadcastAgain event with the whole convention in payload",
        async (user) => {
          await broadcastConventionAgain.execute(
            { conventionId: convention.id },
            user,
          );

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionBroadcastRequested",
              status: "never-published",
              payload: {
                convention: convention,
                triggeredBy: { kind: "inclusion-connected", userId: user.id },
              },
            },
          ]);
        },
      );
    });

    describe("when there is a previous broadcast", () => {
      it.each([adminUser, userWithEnoughRights])(
        "trigger ConventionBroadcastAgain event with the whole convention in payload",
        async (user) => {
          uow.broadcastFeedbacksRepository.save({
            serviceName: broadcastToFtServiceName,
            consumerId: "my-consumer-id",
            consumerName: "My consumer name",
            requestParams: {
              conventionId: convention.id,
            },
            response: { httpStatus: 404 },
            subscriberErrorFeedback: { message: "Ops, something is bad" },
            occurredAt: subDays(timeGateway.now(), 1),
            handledByAgency: true,
          });

          await broadcastConventionAgain.execute(
            { conventionId: convention.id },
            user,
          );

          expectArraysToMatch(uow.outboxRepository.events, [
            {
              topic: "ConventionBroadcastRequested",
              status: "never-published",
              payload: {
                convention,
                triggeredBy: { kind: "inclusion-connected", userId: user.id },
              },
            },
          ]);
        },
      );

      it("throws tooManyRequest when user request broadcast again before 4h since last broadcast", async () => {
        const lastBroadcastDate = subHours(
          addMinutes(timeGateway.now(), 12),
          1,
        );

        uow.broadcastFeedbacksRepository.save({
          serviceName: broadcastToFtServiceName,
          consumerId: "my-consumer-id",
          consumerName: "My consumer name",
          requestParams: {
            conventionId: convention.id,
          },
          response: { httpStatus: 404 },
          subscriberErrorFeedback: { message: "Ops, something is bad" },
          occurredAt: lastBroadcastDate,
          handledByAgency: true,
        });

        await expectPromiseToFailWithError(
          broadcastConventionAgain.execute(
            { conventionId: convention.id },
            adminUser,
          ),
          errors.broadcastFeedback.tooManyRequests({
            lastBroadcastDate,
            formattedWaitingTime: "3 heures 12 minutes",
          }),
        );
      });
    });
  });
});
