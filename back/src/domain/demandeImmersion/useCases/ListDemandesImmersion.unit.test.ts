import { InMemoryDemandeImmersionRepository } from "src/adapters/secondary/InMemoryDemandeImmersionRepository";
import { ListDemandeImmersion } from "src/domain/demandeImmersion/useCases/ListDemandeImmersion";
import { validDemandeImmersion } from "src/domain/demandeImmersion/entities/DemandeImmersionIdEntityTestData";
import { DemandeImmersionEntity } from "src/domain/demandeImmersion/entities/DemandeImmersionEntity";

describe("List DemandeImmersion", () => {
  let repository: InMemoryDemandeImmersionRepository;
  let listDemandeImmersion: ListDemandeImmersion;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    listDemandeImmersion = new ListDemandeImmersion({
      demandeImmersionRepository: repository,
    });
  });

  describe("When the repository is empty", () => {
    test("returns empty list", async () => {
      const demandesImmersion = await listDemandeImmersion.execute();
      expect(demandesImmersion).toEqual([]);
    });
  });

  describe("When a demandeImmersion is stored", () => {
    test("returns the demandeImmersion", async () => {
      const demandeImmersionEntity = DemandeImmersionEntity.create(
        validDemandeImmersion
      );
      repository.setDemandesImmersion({ form_id: demandeImmersionEntity });

      const demandesImmersion = await listDemandeImmersion.execute();
      expect(demandesImmersion).toEqual([demandeImmersionEntity.toDto()]);
    });
  });
});
