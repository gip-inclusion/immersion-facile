import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { UpdateImmersionApplication } from "../../../domain/immersionApplication/useCases/UpdateImmersionApplication";
import { FeatureFlags } from "../../../shared/featureFlags";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import {
  ImmersionApplicationId,
  validApplicationStatus,
} from "../../../shared/ImmersionApplicationDto";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";

describe("Update immersionApplication", () => {
  let updateImmersionApplication: UpdateImmersionApplication;
  let immersionApplicationRepository: InMemoryImmersionApplicationRepository;
  let featureFlags: FeatureFlags;
  let outboxRepository: OutboxRepository;
  let createNewEvent: CreateNewEvent;

  beforeEach(() => {
    immersionApplicationRepository =
      new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    createNewEvent = makeCreateNewEvent({
      clock: new CustomClock(),
      uuidGenerator: new TestUuidGenerator(),
    });
    featureFlags = FeatureFlagsBuilder.allOff().build();

    updateImmersionApplication = new UpdateImmersionApplication(
      createNewEvent,
      outboxRepository,
      immersionApplicationRepository,
      featureFlags,
    );
  });

  describe("When the immersionApplication is valid", () => {
    test("updates the immersionApplication in the repository", async () => {
      const immersionApplications: Record<string, ImmersionApplicationEntity> =
        {};
      const immersionApplicationEntity =
        new ImmersionApplicationEntityBuilder().build();
      immersionApplications[immersionApplicationEntity.id] =
        immersionApplicationEntity;
      immersionApplicationRepository.setImmersionApplications(
        immersionApplications,
      );

      const updatedImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withEmail("new@email.fr")
        .build();

      const { id } = await updateImmersionApplication.execute({
        id: updatedImmersionApplication.id,
        immersionApplication: updatedImmersionApplication,
      });
      expect(id).toEqual(updatedImmersionApplication.id);

      const storedInRepo = await immersionApplicationRepository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        updatedImmersionApplication,
      ]);
    });
  });

  describe("When no immersionApplication with id exists", () => {
    it("throws NotFoundError", async () => {
      const id = "40400000000000404";
      const validImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withId(id)
        .build();

      await expectPromiseToFailWithError(
        updateImmersionApplication.execute({
          id,
          immersionApplication: validImmersionApplication,
        }),
        new NotFoundError(id),
      );
    });
  });

  describe("When previous state is not draft (testing with READY_TO_SIGN)", () => {
    it("throws Bad request", async () => {
      //we would expect READY_TO_SIGN to be the most frequent case of previous state that we want to prevent here. Not testing all the possible statuses.
      const updatedImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .build();

      await expectPromiseToFailWithError(
        updateImmersionApplication.execute({
          id: updatedImmersionApplication.id,
          immersionApplication: updatedImmersionApplication,
        }),
        new BadRequestError(updatedImmersionApplication.id),
      );
    });
  });

  describe("Status validation", () => {
    let id: ImmersionApplicationId;
    beforeEach(() => {
      const immersionApplications: Record<string, ImmersionApplicationEntity> =
        {};
      const immersionApplicationEntity =
        new ImmersionApplicationEntityBuilder().build();
      immersionApplications[immersionApplicationEntity.id] =
        immersionApplicationEntity;
      immersionApplicationRepository.setImmersionApplications(
        immersionApplications,
      );
      id = immersionApplicationEntity.id;
    });

    // This might be nice for "backing up" entered data, but not implemented in front end as of Dec 16, 2021
    it("allows applications submitted as DRAFT", async () => {
      const validImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withId(id)
        .build();

      expect(
        await updateImmersionApplication.execute({
          immersionApplication: validImmersionApplication,
          id: validImmersionApplication.id,
        }),
      ).toEqual({
        id: validImmersionApplication.id,
      });
    });

    it("allows applications submitted as READY_TO_SIGN", async () => {
      const inReviewImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(id)
        .build();

      expect(
        await updateImmersionApplication.execute({
          immersionApplication: inReviewImmersionApplication,
          id: inReviewImmersionApplication.id,
        }),
      ).toEqual({
        id: inReviewImmersionApplication.id,
      });
    });

    it("rejects applications if the status is not DRAFT or READY_TO_SIGN", async () => {
      for (const status of validApplicationStatus) {
        if (status === "DRAFT" || status === "READY_TO_SIGN") {
          continue;
        }
        const immersionApplication = new ImmersionApplicationDtoBuilder()
          .withStatus(status)
          .withId(id)
          .build();
        await expectPromiseToFailWithError(
          updateImmersionApplication.execute({
            immersionApplication,
            id: immersionApplication.id,
          }),
          new ForbiddenError(),
        );
      }
    });
  });
});
