import { makeStubGetFeatureFlags } from "shared/src/featureFlags";
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
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { GetFeatureFlags } from "../../../domain/core/ports/GetFeatureFlags";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { UpdateImmersionApplication } from "../../../domain/convention/useCases/UpdateImmersionApplication";
import { ConventionDtoBuilder } from "../../../../../shared/src/convention/ConventionDtoBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import {
  ConventionId,
  allConventionStatuses,
  ConventionDto,
} from "shared/src/convention/convention.dto";
import { InMemoryConventionQueries } from "../../../adapters/secondary/InMemoryConventionQueries";

describe("Update Convention", () => {
  let updateConvention: UpdateImmersionApplication;
  let conventionRepository: InMemoryConventionRepository;
  let outboxRepo: OutboxRepository;
  let createNewEvent: CreateNewEvent;
  let getFeatureFlags: GetFeatureFlags;
  let uowPerformer: InMemoryUowPerformer;

  beforeEach(() => {
    conventionRepository = new InMemoryConventionRepository();
    outboxRepo = new InMemoryOutboxRepository();
    createNewEvent = makeCreateNewEvent({
      clock: new CustomClock(),
      uuidGenerator: new TestUuidGenerator(),
    });
    getFeatureFlags = makeStubGetFeatureFlags({
      enableAdminUi: false,
      enableInseeApi: true,
    });

    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      outboxRepo,
      conventionRepository,
      getFeatureFlags,
    });

    updateConvention = new UpdateImmersionApplication(
      uowPerformer,
      createNewEvent,
    );
  });

  describe("When the Convention is valid", () => {
    it("updates the Convention in the repository", async () => {
      const conventions: Record<string, ConventionDto> = {};
      const convention = new ConventionDtoBuilder().build();
      conventions[convention.id] = convention;
      conventionRepository.setConventions(conventions);

      const updatedConvention = new ConventionDtoBuilder()
        .withEmail("new@email.fr")
        .build();

      const { id } = await updateConvention.execute({
        id: updatedConvention.id,
        convention: updatedConvention,
      });
      expect(id).toEqual(updatedConvention.id);

      const storedInRepo = await new InMemoryConventionQueries(
        conventionRepository,
      ).getLatestUpdated();
      expect(storedInRepo).toEqual([updatedConvention]);
    });
  });

  describe("When no Convention with id exists", () => {
    it("throws NotFoundError", async () => {
      const id = "40400000000000404";
      const validConvention = new ConventionDtoBuilder().withId(id).build();

      await expectPromiseToFailWithError(
        updateConvention.execute({
          id,
          convention: validConvention,
        }),
        new NotFoundError(id),
      );
    });
  });

  describe("When previous state is not draft (testing with READY_TO_SIGN)", () => {
    it("throws Bad request", async () => {
      //we would expect READY_TO_SIGN to be the most frequent case of previous state that we want to prevent here. Not testing all the possible statuses.
      const updatedConvention = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .build();

      await expectPromiseToFailWithError(
        updateConvention.execute({
          id: updatedConvention.id,
          convention: updatedConvention,
        }),
        new BadRequestError(updatedConvention.id),
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

    // This might be nice for "backing up" entered data, but not implemented in front end as of Dec 16, 2021
    it("allows applications submitted as DRAFT", async () => {
      const validConvention = new ConventionDtoBuilder().withId(id).build();

      expect(
        await updateConvention.execute({
          convention: validConvention,
          id: validConvention.id,
        }),
      ).toEqual({
        id: validConvention.id,
      });
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
          new ForbiddenError(),
        );
      }
    });
  });
});
