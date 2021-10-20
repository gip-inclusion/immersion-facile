import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { GetImmersionApplication } from "../../../domain/immersionApplication/useCases/GetImmersionApplication";
import { FeatureFlags } from "../../../shared/featureFlags";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Get DemandeImmersion", () => {
  let getDemandeImmersion: GetImmersionApplication;
  let repository: InMemoryImmersionApplicationRepository;

  beforeEach(() => {
    repository = new InMemoryImmersionApplicationRepository();
    getDemandeImmersion = new GetImmersionApplication(repository);
  });

  describe("When the DemandeImmersion does not exist", () => {
    it("throws NotFoundError", async () => {
      expectPromiseToFailWithError(
        getDemandeImmersion.execute({ id: "unknown_demande_immersion_id" }),
        new NotFoundError("unknown_demande_immersion_id"),
      );
    });
  });

  describe("When a DemandeImmersion is stored", () => {
    it("returns the DemandeImmersion", async () => {
      const entity = new ImmersionApplicationEntityBuilder().build();
      repository.setDemandesImmersion({ [entity.id]: entity });

      const demandeImmersion = await getDemandeImmersion.execute({
        id: entity.id,
      });
      expect(demandeImmersion).toEqual(entity.toDto());
    });
  });
});
