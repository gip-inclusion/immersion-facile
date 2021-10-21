import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
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
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { FeatureFlagsBuilder } from "./../../../_testBuilders/FeatureFlagsBuilder";

describe("Update immersionApplication", () => {
  let updateDemandeImmersion: UpdateImmersionApplication;
  let repository: InMemoryImmersionApplicationRepository;
  let featureFlags: FeatureFlags;
  let outboxRepository: OutboxRepository;
  let createNewEvent: CreateNewEvent;

  beforeEach(() => {
    repository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    createNewEvent = makeCreateNewEvent({
      clock: new CustomClock(),
      uuidGenerator: new TestUuidGenerator(),
    });
  });

  const createUpdateDemandeImmersionUseCase = () => {
    return new UpdateImmersionApplication(
      createNewEvent,
      outboxRepository,
      repository,
      featureFlags,
    );
  };

  describe("When enableViewableApplication in on", () => {
    beforeEach(() => {
      featureFlags = FeatureFlagsBuilder.allOff()
        .enableViewableApplications()
        .build();
      updateDemandeImmersion = createUpdateDemandeImmersionUseCase();
    });

    describe("When the immersionApplication is valid", () => {
      test("updates the immersionApplication in the repository", async () => {
        const demandesImmersion: ImmersionApplications = {};
        const demandeImmersionEntity =
          new ImmersionApplicationEntityBuilder().build();
        demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
        repository.setDemandesImmersion(demandesImmersion);

        const updatedDemandeImmersion = new ImmersionApplicationDtoBuilder()
          .withEmail("new@email.fr")
          .build();

        const { id } = await updateDemandeImmersion.execute({
          id: updatedDemandeImmersion.id,
          demandeImmersion: updatedDemandeImmersion,
        });
        expect(id).toEqual(updatedDemandeImmersion.id);

        const storedInRepo = await repository.getAll();
        expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
          updatedDemandeImmersion,
        ]);
      });
    });

    describe("When no immersionApplication with id exists", () => {
      it("throws NotFoundError", async () => {
        const validDemandeImmersion =
          new ImmersionApplicationDtoBuilder().build();

        await expectPromiseToFailWithError(
          updateDemandeImmersion.execute({
            id: "unknown_demande_immersion_id",
            demandeImmersion: validDemandeImmersion,
          }),
          new NotFoundError("unknown_demande_immersion_id"),
        );
      });
    });
  });

  describe("When enableViewableApplications is off", () => {
    beforeEach(() => {
      featureFlags = FeatureFlagsBuilder.allOff().build();
      updateDemandeImmersion = createUpdateDemandeImmersionUseCase();
    });

    it("throws FeatureDisabledError", async () => {
      const validDemandeImmersion =
        new ImmersionApplicationDtoBuilder().build();
      expectPromiseToFailWithError(
        updateDemandeImmersion.execute({
          id: "demande_id",
          demandeImmersion: validDemandeImmersion,
        }),
        new FeatureDisabledError(),
      );
    });
  });
});
