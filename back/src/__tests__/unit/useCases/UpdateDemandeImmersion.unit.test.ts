import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  DemandesImmersion,
  InMemoryDemandeImmersionRepository,
} from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { UpdateDemandeImmersion } from "../../../domain/demandeImmersion/useCases/UpdateDemandeImmersion";
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { DemandeImmersionDtoBuilder } from "../../../_testBuilders/DemandeImmersionDtoBuilder";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { FeatureFlagsBuilder } from "./../../../_testBuilders/FeatureFlagsBuilder";

describe("Update demandeImmersion", () => {
  let updateDemandeImmersion: UpdateDemandeImmersion;
  let repository: InMemoryDemandeImmersionRepository;
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
  });

  const createUpdateDemandeImmersionUseCase = () => {
    return new UpdateDemandeImmersion({
      demandeImmersionRepository: repository,
      featureFlags,
    });
  };

  describe("When enableViewableApplication in on", () => {
    beforeEach(() => {
      featureFlags = FeatureFlagsBuilder.allOff()
        .enableViewableApplications()
        .build();
      updateDemandeImmersion = createUpdateDemandeImmersionUseCase();
    });

    describe("When the demandeImmersion is valid", () => {
      test("updates the demandeImmersion in the repository", async () => {
        const demandesImmersion: DemandesImmersion = {};
        const demandeImmersionEntity =
          new DemandeImmersionEntityBuilder().build();
        demandesImmersion[demandeImmersionEntity.id] = demandeImmersionEntity;
        repository.setDemandesImmersion(demandesImmersion);

        const updatedDemandeImmersion = new DemandeImmersionDtoBuilder()
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

    describe("When no demandeImmersion with id exists", () => {
      it("throws NotFoundError", async () => {
        const validDemandeImmersion = new DemandeImmersionDtoBuilder().build();

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
      const validDemandeImmersion = new DemandeImmersionDtoBuilder().build();
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
