import { DemandeImmersionId } from "../../../shared/DemandeImmersionDto";
import { UpdateDemandeImmersion } from "./UpdateDemandeImmersion";
import {
  DemandesImmersion,
  InMemoryDemandeImmersionRepository,
} from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { validDemandeImmersion } from "../entities/DemandeImmersionIdEntityTestData";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { expectPromiseToFailWithError } from "../../../utils/test.helpers";

describe("Update demandeImmersion", () => {
  const DEMANDE_IMMERSION_ID: DemandeImmersionId = "some_id";

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
      demandesImmersion[DEMANDE_IMMERSION_ID] = DemandeImmersionEntity.create(
        validDemandeImmersion
      );
      repository.setDemandesImmersion(demandesImmersion);

      const updatedDemandeImmersion = {
        ...validDemandeImmersion,
        email: "new@email.fr",
      };
      const id = await updateDemandeImmersion.execute({
        id: DEMANDE_IMMERSION_ID,
        demandeImmersion: updatedDemandeImmersion,
      });
      expect(id).toEqual(DEMANDE_IMMERSION_ID);

      const storedInRepo = await repository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        updatedDemandeImmersion,
      ]);
    });
  });

  describe("When no demandeImmersion with id exists", () => {
    it("throws NotFoundError", async () => {
      expectPromiseToFailWithError(
        updateDemandeImmersion.execute({
          id: "unknown_demande_immersion_id",
          demandeImmersion: validDemandeImmersion,
        }),
        new NotFoundError("unknown_demande_immersion_id")
      );
    });
  });
});
