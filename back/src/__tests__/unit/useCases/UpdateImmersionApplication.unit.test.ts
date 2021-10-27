import {
  BadRequestError,
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

describe("Update immersionApplication", () => {
  let updateDemandeImmersion: UpdateImmersionApplication;
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

    updateDemandeImmersion = new UpdateImmersionApplication(
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

      const { id } = await updateDemandeImmersion.execute({
        id: updatedDemandeImmersion.id,
        demandeImmersion: updatedDemandeImmersion,
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
        updateDemandeImmersion.execute({
          id,
          demandeImmersion: validImmersionApplication,
        }),
        new NotFoundError(id),
      );
    });
  });

  describe("When previous state is not draft (testing with In_review)", () => {
    it("throws Bad request", async () => {
      const validDemandeImmersion =
        new ImmersionApplicationDtoBuilder().build();
      //we would expect IN_REVIEW to be the most frequent case of previous state that we want to prevent here. Not testing all the possible statuses.
      validDemandeImmersion.status = "IN_REVIEW";

      expectPromiseToFailWithError(
        updateDemandeImmersion.execute({
          id: "demande_id",
          demandeImmersion: validDemandeImmersion,
        }),
        new BadRequestError(),
      );
    });
  });
});
