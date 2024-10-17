import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../../utils/agency";
import { InMemoryOutboxRepository } from "../../../core/events/adapters/InMemoryOutboxRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../core/events/ports/EventBus";
import {
  BroadcastFeedback,
  broadcastToPeServiceName,
} from "../../../core/saved-errors/ports/BroadcastFeedbacksRepository";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
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

  const icJwtDomainPayload: InclusionConnectDomainJwtPayload = { userId };

  const icuser = new InclusionConnectedUserBuilder()
    .withId(userId)
    .withFirstName("John")
    .withLastName("Doe")
    .withEmail("my-user@email.com")
    .withCreatedAt(new Date())
    .withExternalId("icUser-external-id")
    .build();

  const agency = new AgencyDtoBuilder()
    .withValidatorEmails([])
    .withCounsellorEmails([])
    .build();
  const agencyWithRights = toAgencyWithRights(agency, {
    [icuser.id]: {
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
      serviceName: broadcastToPeServiceName,
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

    uow.userRepository.users = [icuser];
    uow.agencyRepository.agencies = [agencyWithRights];

    await markPartnersErroredConventionAsHandled.execute(
      {
        conventionId,
      },
      icJwtDomainPayload,
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
            kind: "inclusion-connected",
            userId: icJwtDomainPayload.userId,
          },
        },
      }),
    ]);
  });

  it("Throw when convention is not errored", async () => {
    const conventionRepository = uow.conventionRepository;

    await conventionRepository.save(convention);

    uow.userRepository.users = [icuser];
    uow.agencyRepository.agencies = [agencyWithRights];

    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        {
          conventionId,
        },
        icJwtDomainPayload,
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
      serviceName: broadcastToPeServiceName,
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
    userRepository.users = [icuser];
    uow.agencyRepository.agencies = [agencyWithRights];

    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        {
          conventionId,
        },
        icJwtDomainPayload,
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
        icJwtDomainPayload,
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
        icJwtDomainPayload,
      ),
      errors.user.notFound({ userId }),
    );
  });

  it("Throw when user doesn't have right for agency", async () => {
    const conventionRepository = uow.conventionRepository;
    const userRepository = uow.userRepository;

    await conventionRepository.save(convention);
    userRepository.users = [icuser];

    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        {
          conventionId,
        },
        icJwtDomainPayload,
      ),
      errors.user.noRightsOnAgency({
        agencyId: agency.id,
        userId,
      }),
    );
  });
});
