import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { ListDemandeImmersion } from "./ListDemandeImmersion";
import { validDemandeImmersion } from "../entities/DemandeImmersionIdEntityTestData";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";

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
