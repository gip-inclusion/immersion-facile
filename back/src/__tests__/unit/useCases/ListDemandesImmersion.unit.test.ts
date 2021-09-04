import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { ListDemandeImmersion } from "../../../domain/demandeImmersion/useCases/ListDemandeImmersion";

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
      const entity = new DemandeImmersionEntityBuilder().build();
      repository.setDemandesImmersion({ form_id: entity });

      const demandesImmersion = await listDemandeImmersion.execute();
      expect(demandesImmersion).toEqual([entity.toDto()]);
    });
  });
});
