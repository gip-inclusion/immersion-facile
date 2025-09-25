import {
  AgencyDtoBuilder,
  type BroadcastFeedback,
  ConnectedUserBuilder,
  type ConnectedUserDomainJwtPayload,
  ConventionDtoBuilder,
  defaultProConnectInfos,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import type { InMemoryOutboxRepository } from "../../../core/events/adapters/InMemoryOutboxRepository";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../../core/events/ports/EventBus";
import { broadcastToFtLegacyServiceName } from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { MarkPartnersErroredConventionAsHandled } from "./MarkPartnersErroredConventionAsHandled";

describe("mark partners errored convention as handled", () => {
  let uow: InMemoryUnitOfWork;
  let outboxRepo: InMemoryOutboxRepository;
  let timeGateway: CustomTimeGateway;
  let markPartnersErroredConventionAsHandled: MarkPartnersErroredConventionAsHandled;
  let createNewEvent: CreateNewEvent;

  const conventionId = "add5c20e-6dd2-45af-affe-927358004444";
  const userId = "decd5596-bf79-45ae-8e77-6913f1069835";

  const connectedUserJwtDomainPayload: ConnectedUserDomainJwtPayload = {
    userId,
  };

  const user = new ConnectedUserBuilder()
    .withId(userId)
    .withFirstName("John")
    .withLastName("Doe")
    .withEmail("my-user@email.com")
    .withCreatedAt(new Date())
    .withProConnectInfos(defaultProConnectInfos)
    .build();

  const agency = new AgencyDtoBuilder().build();
  const agencyWithRights = toAgencyWithRights(agency, {
    [user.id]: {
      roles: ["validator"],
      isNotifiedByEmail: false,
    },
  });

  const convention = new ConventionDtoBuilder()
    .withId(conventionId)
    .withAgencyId(agency.id)
    .build();

  beforeEach(() => {
    uow = createInMemoryUow();
    outboxRepo = uow.outboxRepository;
    timeGateway = new CustomTimeGateway();

    createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator: new TestUuidGenerator(),
    });

    markPartnersErroredConventionAsHandled =
      new MarkPartnersErroredConventionAsHandled(
        new InMemoryUowPerformer(uow),
        createNewEvent,
        timeGateway,
      );
  });

  it("Mark partner errored convention as handled", async () => {
    const savedErrorConvention: BroadcastFeedback = {
      serviceName: broadcastToFtLegacyServiceName,
      consumerName: "Yolo",
      consumerId: "yolo-id",
      requestParams: {
        conventionId,
      },
      response: { httpStatus: 404 },
      subscriberErrorFeedback: { message: "Ops, something is bad" },
      occurredAt: timeGateway.now(),
      handledByAgency: false,
    };

    await uow.conventionRepository.save(convention);
    await uow.broadcastFeedbacksRepository.save(savedErrorConvention);

    uow.userRepository.users = [user];
    uow.agencyRepository.agencies = [agencyWithRights];

    await markPartnersErroredConventionAsHandled.execute(
      {
        conventionId,
      },
      connectedUserJwtDomainPayload,
    );

    expectToEqual(uow.broadcastFeedbacksRepository.broadcastFeedbacks, [
      {
        ...savedErrorConvention,
        handledByAgency: true,
      },
    ]);

    expectToEqual(outboxRepo.events, [
      createNewEvent({
        topic: "PartnerErroredConventionMarkedAsHandled",
        payload: {
          conventionId,
          userId,
          triggeredBy: {
            kind: "connected-user",
            userId: connectedUserJwtDomainPayload.userId,
          },
        },
      }),
    ]);
  });

  it("Throw when convention is not errored", async () => {
    const conventionRepository = uow.conventionRepository;

    await conventionRepository.save(convention);

    uow.userRepository.users = [user];
    uow.agencyRepository.agencies = [agencyWithRights];

    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        {
          conventionId,
        },
        connectedUserJwtDomainPayload,
      ),
      errors.broadcastFeedback.notFound({
        conventionId,
      }),
    );
  });

  it("Throw when convention is errored but already handled", async () => {
    const conventionRepository = uow.conventionRepository;
    const userRepository = uow.userRepository;
    const broadcastFeedbacksRepository = uow.broadcastFeedbacksRepository;

    const savedHandledErrorConvention: BroadcastFeedback = {
      serviceName: broadcastToFtLegacyServiceName,
      consumerId: "my-consumer-id",
      consumerName: "My consumer name",
      requestParams: {
        conventionId,
      },
      response: { httpStatus: 404 },
      subscriberErrorFeedback: { message: "Ops, something is bad" },
      occurredAt: timeGateway.now(),
      handledByAgency: true,
    };

    await conventionRepository.save(convention);
    await broadcastFeedbacksRepository.save(savedHandledErrorConvention);
    userRepository.users = [user];
    uow.agencyRepository.agencies = [agencyWithRights];

    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        {
          conventionId,
        },
        connectedUserJwtDomainPayload,
      ),
      errors.broadcastFeedback.notFound({
        conventionId,
      }),
    );
  });

  it("Throw when no jwt were provided", async () => {
    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute({
        conventionId,
      }),
      errors.user.unauthorized(),
    );
  });

  it("Throw when no convention was found", async () => {
    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        {
          conventionId,
        },
        connectedUserJwtDomainPayload,
      ),
      errors.convention.notFound({ conventionId }),
    );
  });

  it("Throw when no user was found", async () => {
    const conventionRepository = uow.conventionRepository;

    await conventionRepository.save(convention);

    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        { conventionId },
        connectedUserJwtDomainPayload,
      ),
      errors.user.notFound({ userId }),
    );
  });

  it("Throw when user doesn't have right for agency", async () => {
    const conventionRepository = uow.conventionRepository;
    const userRepository = uow.userRepository;

    await conventionRepository.save(convention);
    userRepository.users = [user];

    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        {
          conventionId,
        },
        connectedUserJwtDomainPayload,
      ),
      errors.user.noRightsOnAgency({
        agencyId: agency.id,
        userId,
      }),
    );
  });
});
