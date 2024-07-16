import {
  ConventionDtoBuilder,
  DiscussionBuilder,
  conventionStatuses,
  errorMessages,
  expectPromiseToFailWithError,
} from "shared";
import { BadRequestError, ConflictError, ForbiddenError } from "shared";
import { DomainEvent } from "../../core/events/events";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import {
  InMemorySiretGateway,
  SiretEstablishmentDtoBuilder,
} from "../../core/sirene/adapters/InMemorySiretGateway";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { AddConvention } from "./AddConvention";

const validConvention = new ConventionDtoBuilder().build();

describe("Add Convention", () => {
  let addConvention: AddConvention;
  let createNewEvent: CreateNewEvent;
  let siretGateway: InMemorySiretGateway;
  let timeGateway: CustomTimeGateway;
  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });
    siretGateway = new InMemorySiretGateway();
    const uowPerformer = new InMemoryUowPerformer(uow);
    addConvention = new AddConvention(
      uowPerformer,
      createNewEvent,
      siretGateway,
    );
  });

  it("saves valid conventions in the repository", async () => {
    const occurredAt = new Date("2021-10-15T15:00");
    const id = "eventId";
    timeGateway.setNextDate(occurredAt);
    uuidGenerator.setNextUuid(id);

    expect(
      await addConvention.execute({ convention: validConvention }),
    ).toEqual({
      id: validConvention.id,
    });

    const storedInRepo = uow.conventionRepository.conventions;
    expect(storedInRepo[0]).toEqual(validConvention);
    expectDomainEventsToBeInOutbox([
      {
        id,
        occurredAt: occurredAt.toISOString(),
        topic: "ConventionSubmittedByBeneficiary",
        payload: { convention: validConvention, triggeredBy: null },
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });

  it("also sends the discussionId in the event, if initialy provided to the use case", async () => {
    const discussion = new DiscussionBuilder().build();
    const occurredAt = new Date("2021-10-15T15:00");
    const id = "eventId";
    timeGateway.setNextDate(occurredAt);
    uuidGenerator.setNextUuid(id);

    expect(
      await addConvention.execute({
        convention: validConvention,
        discussionId: discussion.id,
      }),
    ).toEqual({
      id: validConvention.id,
    });

    const storedInRepo = uow.conventionRepository.conventions;
    expect(storedInRepo[0]).toEqual(validConvention);
    expectDomainEventsToBeInOutbox([
      {
        id,
        occurredAt: occurredAt.toISOString(),
        topic: "ConventionSubmittedByBeneficiary",
        payload: {
          convention: validConvention,
          discussionId: discussion.id,
          triggeredBy: null,
        },
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });

  it("rejects conventions where the ID is already in use", async () => {
    await uow.conventionRepository.save(validConvention);

    await expectPromiseToFailWithError(
      addConvention.execute({ convention: validConvention }),
      new ConflictError(
        errorMessages.convention.conflict({ conventionId: validConvention.id }),
      ),
    );
  });

  describe("Status validation", () => {
    // This might be nice for "backing up" entered data, but not implemented in front end as of Dec 16, 2021
    it("allows applications submitted as DRAFT", async () => {
      expect(
        await addConvention.execute({ convention: validConvention }),
      ).toEqual({
        id: validConvention.id,
      });
    });

    it("allows applications submitted as READY_TO_SIGN", async () => {
      expect(
        await addConvention.execute({
          convention: {
            ...validConvention,
            status: "READY_TO_SIGN",
          },
        }),
      ).toEqual({
        id: validConvention.id,
      });
    });

    it("rejects applications if the status is not DRAFT or READY_TO_SIGN", async () => {
      for (const status of conventionStatuses) {
        // eslint-disable-next-line jest/no-if
        if (status === "DRAFT" || status === "READY_TO_SIGN") {
          continue;
        }
        await expectPromiseToFailWithError(
          addConvention.execute({
            convention: {
              ...validConvention,
              status,
            },
          }),
          new ForbiddenError(
            errorMessages.convention.forbiddenStatus({ status }),
          ),
        );
      }
    });
  });

  describe("SIRET validation", () => {
    const siretRawEstablishmentBuilder = new SiretEstablishmentDtoBuilder()
      .withSiret(validConvention.siret)
      .withNafDto({ code: "78.3Z", nomenclature: "Ref2" });

    const siretRawInactiveEstablishment = siretRawEstablishmentBuilder
      .withBusinessName("INACTIVE BUSINESS")
      .withIsActive(false)
      .build();

    const siretRawActiveEstablishment = siretRawEstablishmentBuilder
      .withBusinessName("Active BUSINESS")
      .withIsActive(true)
      .build();

    it("rejects applications with SIRETs that don't correspond to active businesses", async () => {
      siretGateway.setSirenEstablishment(siretRawInactiveEstablishment);

      await expectPromiseToFailWithError(
        addConvention.execute({ convention: validConvention }),
        new BadRequestError(
          `Ce SIRET (${validConvention.siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
        ),
      );
    });

    it("accepts applications with SIRETs that  correspond to active businesses", async () => {
      siretGateway.setSirenEstablishment(siretRawActiveEstablishment);

      expect(
        await addConvention.execute({ convention: validConvention }),
      ).toEqual({
        id: validConvention.id,
      });
    });

    it("Throws errors when the SIRET endpoint throws erorrs", async () => {
      const error = new Error("test error");
      siretGateway.setError(error);

      await expectPromiseToFailWithError(
        addConvention.execute({ convention: validConvention }),
        new Error("Le service Sirene API n'est pas disponible"),
      );
    });
  });

  const expectDomainEventsToBeInOutbox = (expected: DomainEvent[]) => {
    expect(uow.outboxRepository.events).toEqual(expected);
  };
});
