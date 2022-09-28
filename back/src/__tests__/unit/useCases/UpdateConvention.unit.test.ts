import { allConventionStatuses, ConventionDto, ConventionId } from "shared";
import { ConventionDtoBuilder } from "shared";
import {
  expectPromiseToFailWithError,
  expectTypeToMatchAndEqual,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryFeatureFlagRepository } from "../../../adapters/secondary/InMemoryFeatureFlagRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { UpdateConvention } from "../../../domain/convention/useCases/UpdateConvention";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";

describe("Update Convention", () => {
  let updateConvention: UpdateConvention;
  let conventionRepository: InMemoryConventionRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let createNewEvent: CreateNewEvent;
  let uowPerformer: InMemoryUowPerformer;

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionRepository = uow.conventionRepository;
    outboxRepo = uow.outboxRepository;
    uow.featureFlagRepository = new InMemoryFeatureFlagRepository({
      enableAdminUi: false,
      enableInseeApi: true,
    });

    createNewEvent = makeCreateNewEvent({
      clock: new CustomClock(),
      uuidGenerator: new TestUuidGenerator(),
    });

    uowPerformer = new InMemoryUowPerformer(uow);

    updateConvention = new UpdateConvention(uowPerformer, createNewEvent);
  });

  describe("When the Convention is valid", () => {
    it("updates the Convention in the repository", async () => {
      const conventionsInRepo: Record<string, ConventionDto> = {};
      const conventionInRepo = new ConventionDtoBuilder().build();
      conventionsInRepo[conventionInRepo.id] = conventionInRepo;
      conventionRepository.setConventions(conventionsInRepo);

      const updatedConvention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withBeneficiaryEmail("new@email.fr")
        .build();

      const { id } = await updateConvention.execute({
        id: updatedConvention.id,
        convention: updatedConvention,
      });
      expect(id).toEqual(updatedConvention.id);
      expect(conventionRepository.conventions).toEqual([updatedConvention]);
    });
  });

  describe("When no Convention with id exists", () => {
    it("throws NotFoundError", async () => {
      const id = "40400000000000404";
      const validConvention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(id)
        .build();

      await expectPromiseToFailWithError(
        updateConvention.execute({
          id,
          convention: validConvention,
        }),
        new NotFoundError("Convention with id 40400000000000404 was not found"),
      );
    });
  });

  describe("When previous state is not draft (testing with READY_TO_SIGN)", () => {
    it("throws Bad request", async () => {
      const storedConvention = new ConventionDtoBuilder()
        .withStatus("PARTIALLY_SIGNED")
        .build();

      conventionRepository.setConventions({
        [storedConvention.id]: storedConvention,
      });

      //we would expect READY_TO_SIGN to be the most frequent case of previous state that we want to prevent here. Not testing all the possible statuses.
      const updatedConvention = new ConventionDtoBuilder()
        .withId(storedConvention.id)
        .withStatus("READY_TO_SIGN")
        .build();

      await expectPromiseToFailWithError(
        updateConvention.execute({
          id: updatedConvention.id,
          convention: updatedConvention,
        }),
        new BadRequestError(
          `Convention ${storedConvention.id} cannot be modified as it has status PARTIALLY_SIGNED`,
        ),
      );
    });
  });

  describe("Status validation", () => {
    let id: ConventionId;
    beforeEach(() => {
      const conventions: Record<string, ConventionDto> = {};
      const convention = new ConventionDtoBuilder().build();
      conventions[convention.id] = convention;
      conventionRepository.setConventions(conventions);
      id = convention.id;
    });

    it("allows applications submitted as READY_TO_SIGN", async () => {
      const inReviewConvention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(id)
        .build();

      expect(
        await updateConvention.execute({
          convention: inReviewConvention,
          id: inReviewConvention.id,
        }),
      ).toEqual({
        id: inReviewConvention.id,
      });
    });

    it("rejects applications if the status is not DRAFT or READY_TO_SIGN", async () => {
      for (const status of allConventionStatuses) {
        // eslint-disable-next-line jest/no-if
        if (status === "DRAFT" || status === "READY_TO_SIGN") {
          continue;
        }
        const convention = new ConventionDtoBuilder()
          .withStatus(status)
          .withId(id)
          .build();

        await expectPromiseToFailWithError(
          updateConvention.execute({
            convention,
            id: convention.id,
          }),
          new ForbiddenError(
            "Convention 40400404-9c0b-bbbb-bb6d-6bb9bd38bbbb with modifications should have status READY_TO_SIGN",
          ),
        );
      }
    });

    it("should emit ConventionSubmittedAfterModification event when successful", async () => {
      const inReviewConvention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(id)
        .build();

      const response = await updateConvention.execute({
        convention: inReviewConvention,
        id: inReviewConvention.id,
      });

      expect(outboxRepo.events).toHaveLength(1);
      expectTypeToMatchAndEqual(
        outboxRepo.events[0],
        createNewEvent({
          topic: "ConventionSubmittedAfterModification",
          payload: inReviewConvention,
        }),
      );

      expectTypeToMatchAndEqual(response, {
        id: inReviewConvention.id,
      });
    });

    it("should throw forbidden Error if provided convention has status DRAFT", async () => {
      const draftConvention = new ConventionDtoBuilder()
        .withStatus("DRAFT")
        .withId(id)
        .build();

      await expectPromiseToFailWithError(
        updateConvention.execute({
          convention: draftConvention,
          id: draftConvention.id,
        }),
        new ForbiddenError(
          "Convention 40400404-9c0b-bbbb-bb6d-6bb9bd38bbbb with modifications should have status READY_TO_SIGN",
        ),
      );
    });
  });
});
