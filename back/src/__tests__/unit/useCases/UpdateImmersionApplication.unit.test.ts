import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  ImmersionApplications,
  InMemoryImmersionApplicationRepository,
} from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
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
      const demandesImmersion: ImmersionApplications = {};
      const demandeImmersionEntity =
        new ImmersionApplicationEntityBuilder().build();
      demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
      immersionApplicationRepository.setDemandesImmersion(demandesImmersion);

      const updatedDemandeImmersion = new ImmersionApplicationDtoBuilder()
        .withEmail("new@email.fr")
        .build();

      const { id } = await updateImmersionApplication.execute({
        id: updatedDemandeImmersion.id,
        immersionApplication: updatedDemandeImmersion,
      });
      expect(id).toEqual(updatedDemandeImmersion.id);

      const storedInRepo = await immersionApplicationRepository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        updatedDemandeImmersion,
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

  describe("When previous state is not draft (testing with In_review)", () => {
    it("throws Bad request", async () => {
      //we would expect IN_REVIEW to be the most frequent case of previous state that we want to prevent here. Not testing all the possible statuses.
      const updatedDemandeImmersion = new ImmersionApplicationDtoBuilder()
        .withStatus("IN_REVIEW")
        .build();

      await expectPromiseToFailWithError(
        updateImmersionApplication.execute({
          id: updatedDemandeImmersion.id,
          immersionApplication: updatedDemandeImmersion,
        }),
        new BadRequestError(updatedDemandeImmersion.id),
      );
    });
  });

  describe("Status validation", () => {
    let id: ImmersionApplicationId;
    beforeEach(() => {
      const demandesImmersion: ImmersionApplications = {};
      const demandeImmersionEntity =
        new ImmersionApplicationEntityBuilder().build();
      demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
      immersionApplicationRepository.setDemandesImmersion(demandesImmersion);
      id = demandeImmersionEntity.id;
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

    // Replace IN_REVIEW with READY_TO_SIGN when enabling ENABLE_ENTERPRISE_SIGNATURE by default.
    it("allows applications submitted as IN_REVIEW", async () => {
      const inReviewImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withStatus("IN_REVIEW")
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

    it("rejects applications if the status is not DRAFT or IN_REVIEW", async () => {
      for (const status of validApplicationStatus) {
        // With ENABLE_ENTERPRISE_SIGNATURE flag, replace IN_REVIEW with READY_TO_SIGN
        if (status === "DRAFT" || status === "IN_REVIEW") {
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
