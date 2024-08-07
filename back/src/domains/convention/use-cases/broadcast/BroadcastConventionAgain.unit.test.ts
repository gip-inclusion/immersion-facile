import { addMinutes, subHours } from "date-fns";
import subDays from "date-fns/subDays";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionReadDto,
  InclusionConnectedUserBuilder,
  defaultValidatorEmail,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
} from "shared";
import { makeCreateNewEvent } from "../../../core/events/ports/EventBus";
import {
  BroadcastFeedback,
  broadcastToPeServiceName,
} from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
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

const conventionId = "11111111-1111-4111-1111-111111111111";
const agencyId = "11111111-1111-4111-2222-111111111122";
const agency = new AgencyDtoBuilder().withId(agencyId).build();
const convention = new ConventionDtoBuilder()
  .withId(conventionId)
  .withAgencyId(agencyId)
  .build();
const adminUser = new InclusionConnectedUserBuilder().withIsAdmin(true).build();
const userWithEnoughRights = new InclusionConnectedUserBuilder()
  .withIsAdmin(false)
  .withAgencyRights([
    {
      agency: agency,
      roles: ["validator", "counsellor"],
      isNotifiedByEmail: true,
    },
  ])
  .build();

describe("BroadcastConventionAgain", () => {
  let broadcastConventionAgain: BroadcastConventionAgain;
  let uow: InMemoryUnitOfWork;
  let timeGateway: TimeGateway;

  beforeEach(async () => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const uuidGenerator = new TestUuidGenerator();
    timeGateway = new CustomTimeGateway();
    const createNewEvent = makeCreateNewEvent({
      uuidGenerator,
      timeGateway,
    });
    broadcastConventionAgain = makeBroadcastConventionAgain({
      uowPerformer,
      deps: {
        createNewEvent,
        timeGateway: timeGateway,
      },
    });
    await uow.agencyRepository.insert(
      new AgencyDtoBuilder().withId(agencyId).build(),
    );
    await uow.conventionRepository.save(convention);
  });

  it("throws Forbidden if user doesn't have enough rights on convention", async () => {
    const user = new InclusionConnectedUserBuilder().withIsAdmin(false).build();
    uow.userRepository.users = [user];

    await expectPromiseToFailWithError(
      broadcastConventionAgain.execute({ conventionId }, user),
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

  describe("when there is no previous broadcast", () => {
    it.each([adminUser, userWithEnoughRights])(
      "trigger ConventionBroadcastAgain event with the whole convention in payload",
      async (user) => {
        await broadcastConventionAgain.execute({ conventionId }, user);

        expect(uow.outboxRepository.events).toHaveLength(1);
        const expectedConventionRead: ConventionReadDto = {
          ...convention,
          agencyId: agency.id,
          agencyKind: agency.kind,
          agencyName: agency.name,
          agencyCounsellorEmails: [],
          agencyValidatorEmails: [defaultValidatorEmail],
          agencySiret: agency.agencySiret,
          agencyDepartment: agency.address.departmentCode,
        };

        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionBroadcastRequested",
            status: "never-published",
            payload: {
              convention: expectedConventionRead,
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
        const lastBroadcastDate = subDays(timeGateway.now(), 1);
        const lastBroadcastFeedback: BroadcastFeedback = {
          serviceName: broadcastToPeServiceName,
          consumerId: "my-consumer-id",
          consumerName: "My consumer name",
          requestParams: {
            conventionId,
          },
          response: { httpStatus: 404 },
          subscriberErrorFeedback: { message: "Ops, something is bad" },
          occurredAt: lastBroadcastDate,
          handledByAgency: true,
        };
        uow.broadcastFeedbacksRepository.save(lastBroadcastFeedback);

        await broadcastConventionAgain.execute({ conventionId }, user);

        expect(uow.outboxRepository.events).toHaveLength(1);
        const expectedConventionRead: ConventionReadDto = {
          ...convention,
          agencyId: agency.id,
          agencyKind: agency.kind,
          agencyName: agency.name,
          agencyCounsellorEmails: [],
          agencyValidatorEmails: [defaultValidatorEmail],
          agencySiret: agency.agencySiret,
          agencyDepartment: agency.address.departmentCode,
        };

        expectArraysToMatch(uow.outboxRepository.events, [
          {
            topic: "ConventionBroadcastRequested",
            status: "never-published",
            payload: {
              convention: expectedConventionRead,
              triggeredBy: { kind: "inclusion-connected", userId: user.id },
            },
          },
        ]);
      },
    );

    it("throws tooManyRequest when user request broadcast again before 4h since last broadcast", async () => {
      const lastBroadcastDate = subHours(addMinutes(timeGateway.now(), 12), 1);
      const lastBroadcastFeedback: BroadcastFeedback = {
        serviceName: broadcastToPeServiceName,
        consumerId: "my-consumer-id",
        consumerName: "My consumer name",
        requestParams: {
          conventionId,
        },
        response: { httpStatus: 404 },
        subscriberErrorFeedback: { message: "Ops, something is bad" },
        occurredAt: lastBroadcastDate,
        handledByAgency: true,
      };
      uow.broadcastFeedbacksRepository.save(lastBroadcastFeedback);

      await expectPromiseToFailWithError(
        broadcastConventionAgain.execute({ conventionId }, adminUser),
        errors.broadcastFeedback.tooManyRequests({
          lastBroadcastDate,
          formattedWaitingTime: "3 heures 12 minutes",
        }),
      );
    });
  });
});
