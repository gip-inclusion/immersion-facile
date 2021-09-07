import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { ListDemandeImmersion } from "../../../domain/demandeImmersion/useCases/ListDemandeImmersion";
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("List DemandeImmersion", () => {
  let repository: InMemoryDemandeImmersionRepository;
  let listDemandeImmersion: ListDemandeImmersion;
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    featureFlags = {
      enableViewableApplications: true,
    };
    listDemandeImmersion = new ListDemandeImmersion({
      demandeImmersionRepository: repository,
      featureFlags,
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

  describe("When demandeImmersionRepository is off", () => {
    beforeEach(() => {
      featureFlags = { enableViewableApplications: false };
      listDemandeImmersion = new ListDemandeImmersion({
        demandeImmersionRepository: repository,
        featureFlags,
      });
    });
    it("throws FeatureDisabledError", async () => {
      expectPromiseToFailWithError(
        listDemandeImmersion.execute(),
        new FeatureDisabledError()
      );
    });
  });
});
