import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUser,
  UnauthorizedError,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { InMemoryOutboxRepository } from "../../../core/events/adapters/InMemoryOutboxRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../core/events/ports/EventBus";
import {
  SavedError,
  broadcastToPeServiceName,
} from "../../../core/saved-errors/ports/SavedErrorRepository";
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

  const agency = new AgencyDtoBuilder().build();

  const icUserWithoutRight: InclusionConnectedUser = {
    id: userId,
    email: "my-user@email.com",
    firstName: "John",
    lastName: "Doe",
    agencyRights: [],
    dashboards: {
      agencies: {},
      establishments: {},
    },
    externalId: "icUserWithoutRight-external-id",
    createdAt: new Date().toISOString(),
  };

  const icUserWithAgencyRights: InclusionConnectedUser = {
    id: userId,
    email: "my-user@email.com",
    firstName: "John",
    lastName: "Doe",
    agencyRights: [{ roles: ["validator"], agency, isNotifiedByEmail: false }],
    dashboards: {
      agencies: {},
      establishments: {},
    },
    externalId: "icUserWithAgencyRights-external-id",
    createdAt: new Date().toISOString(),
  };

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
    const conventionRepository = uow.conventionRepository;
    const inclusionConnectRepository = uow.inclusionConnectedUserRepository;
    const savedErrorsRepository = uow.errorRepository;

    const savedErrorConvention: SavedError = {
      serviceName: broadcastToPeServiceName,
      consumerName: "Yolo",
      consumerId: "yolo-id",
      params: {
        conventionId,
        httpStatus: 404,
      },
      subscriberErrorFeedback: { message: "Ops, something is bad" },
      occurredAt: timeGateway.now(),
      handledByAgency: false,
    };

    await conventionRepository.save(convention);
    await savedErrorsRepository.save(savedErrorConvention);

    await inclusionConnectRepository.setInclusionConnectedUsers([
      icUserWithAgencyRights,
    ]);

    await markPartnersErroredConventionAsHandled.execute(
      {
        conventionId,
      },
      icJwtDomainPayload,
    );

    expectToEqual(savedErrorsRepository.savedErrors, [
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

  it("only mark as handled the errored conventions that have the corresponding service name", async () => {
    const conventionRepository = uow.conventionRepository;
    const inclusionConnectRepository = uow.inclusionConnectedUserRepository;
    const savedErrorsRepository = uow.errorRepository;

    const savedErrorConvention1: SavedError = {
      serviceName: broadcastToPeServiceName,
      consumerId: "my-consumer-id",
      consumerName: "My consumer name",
      params: {
        conventionId,
        httpStatus: 404,
      },
      subscriberErrorFeedback: {
        message: "Ops, something is bad",
      },
      occurredAt: timeGateway.now(),
      handledByAgency: false,
    };

    const savedErrorConvention2: SavedError = {
      serviceName: broadcastToPeServiceName,
      consumerId: "my-consumer-id",
      consumerName: "My consumer name",
      params: {
        conventionId,
        httpStatus: 404,
      },
      subscriberErrorFeedback: { message: "Ops, something is bad AGAIN" },
      occurredAt: timeGateway.now(),
      handledByAgency: false,
    };

    const savedErrorConvention3: SavedError = {
      serviceName: "Yolo.serviceName",
      consumerId: "my-consumer-id",
      consumerName: "My consumer name",
      params: {
        conventionId,
        httpStatus: 404,
      },
      subscriberErrorFeedback: {
        message: "yolo",
      },
      occurredAt: timeGateway.now(),
      handledByAgency: false,
    };

    await conventionRepository.save(convention);
    await savedErrorsRepository.save(savedErrorConvention1);
    await savedErrorsRepository.save(savedErrorConvention2);
    await savedErrorsRepository.save(savedErrorConvention3);

    await inclusionConnectRepository.setInclusionConnectedUsers([
      icUserWithAgencyRights,
    ]);

    await markPartnersErroredConventionAsHandled.execute(
      {
        conventionId,
      },
      icJwtDomainPayload,
    );

    expectToEqual(savedErrorsRepository.savedErrors, [
      {
        ...savedErrorConvention1,
        handledByAgency: true,
      },
      {
        ...savedErrorConvention2,
        handledByAgency: true,
      },
      { ...savedErrorConvention3 },
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
    const inclusionConnectRepository = uow.inclusionConnectedUserRepository;

    await conventionRepository.save(convention);
    await inclusionConnectRepository.setInclusionConnectedUsers([
      icUserWithAgencyRights,
    ]);

    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        {
          conventionId,
        },
        icJwtDomainPayload,
      ),
      errors.broadcastFeedback.notFound({
        conventionId,
        serviceName: broadcastToPeServiceName,
      }),
    );
  });

  it("Throw when convention is errored but already handled", async () => {
    const conventionRepository = uow.conventionRepository;
    const inclusionConnectRepository = uow.inclusionConnectedUserRepository;
    const savedErrorsRepository = uow.errorRepository;

    const savedHandledErrorConvention: SavedError = {
      serviceName: broadcastToPeServiceName,
      consumerId: "my-consumer-id",
      consumerName: "My consumer name",
      params: {
        conventionId,
        httpStatus: 404,
      },
      subscriberErrorFeedback: { message: "Ops, something is bad" },
      occurredAt: timeGateway.now(),
      handledByAgency: true,
    };

    await conventionRepository.save(convention);
    await savedErrorsRepository.save(savedHandledErrorConvention);
    await inclusionConnectRepository.setInclusionConnectedUsers([
      icUserWithAgencyRights,
    ]);

    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute(
        {
          conventionId,
        },
        icJwtDomainPayload,
      ),
      errors.broadcastFeedback.notFound({
        serviceName: broadcastToPeServiceName,
        conventionId,
      }),
    );
  });

  it("Throw when no jwt were provided", async () => {
    await expectPromiseToFailWithError(
      markPartnersErroredConventionAsHandled.execute({
        conventionId,
      }),
      new UnauthorizedError(),
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
    const inclusionConnectRepository = uow.inclusionConnectedUserRepository;

    await conventionRepository.save(convention);
    await inclusionConnectRepository.setInclusionConnectedUsers([
      icUserWithoutRight,
    ]);

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
