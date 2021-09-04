import { DemandeImmersionDtoBuilder } from "../../../_testBuilders/DemandeImmersionDtoBuilder";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { UpdateDemandeImmersion } from "../../../domain/demandeImmersion/useCases/UpdateDemandeImmersion";
import {
  DemandesImmersion,
  InMemoryDemandeImmersionRepository,
} from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { DemandeImmersionEntity } from "../../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Update demandeImmersion", () => {
  let repository: InMemoryDemandeImmersionRepository;
  let updateDemandeImmersion: UpdateDemandeImmersion;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    updateDemandeImmersion = new UpdateDemandeImmersion({
      demandeImmersionRepository: repository,
    });
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
        new NotFoundError("unknown_demande_immersion_id")
      );
    });
  });
});
