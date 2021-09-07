import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { GetDemandeImmersion } from "../../../domain/demandeImmersion/useCases/GetDemandeImmersion";
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Get DemandeImmersion", () => {
  let repository: InMemoryDemandeImmersionRepository;
  let getDemandeImmersion: GetDemandeImmersion;
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    featureFlags = {
      enableViewableApplications: true,
    };
    getDemandeImmersion = new GetDemandeImmersion({
      demandeImmersionRepository: repository,
      featureFlags,
    });
  });

  describe("When the DemandeImmersion does not exist", () => {
    it("throws NotFoundError", async () => {
      expectPromiseToFailWithError(
        getDemandeImmersion.execute({ id: "unknown_demande_immersion_id" }),
        new NotFoundError("unknown_demande_immersion_id")
      );
    });
  });

  describe("When a DemandeImmersion is stored", () => {
    it("returns the DemandeImmersion", async () => {
      const entity = new DemandeImmersionEntityBuilder().build();
      repository.setDemandesImmersion({ [entity.id]: entity });

      const demandeImmersion = await getDemandeImmersion.execute({
        id: entity.id,
      });
      expect(demandeImmersion).toEqual(entity.toDto());
    });
  });

  describe("When enableViewableApplications is off", () => {
    beforeEach(() => {
      featureFlags = { enableViewableApplications: false };
      getDemandeImmersion = new GetDemandeImmersion({
        demandeImmersionRepository: repository,
        featureFlags,
      });
    });
    it("throws FeatureDisabledError", async () => {
      expectPromiseToFailWithError(
        getDemandeImmersion.execute({ id: "demande_id" }),
        new FeatureDisabledError()
      );
    });
  });
});
