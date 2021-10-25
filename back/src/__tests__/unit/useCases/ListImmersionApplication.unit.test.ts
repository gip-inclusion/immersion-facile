import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { ListImmersionApplication } from "../../../domain/immersionApplication/useCases/ListImmersionApplication";
import { FeatureFlags } from "../../../shared/featureFlags";
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";

describe("List Immersion Applications", () => {
  let listImmersionApplication: ListImmersionApplication;
  let repository: InMemoryImmersionApplicationRepository;
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    repository = new InMemoryImmersionApplicationRepository();
    featureFlags = FeatureFlagsBuilder.allOff().build();
    listImmersionApplication = new ListImmersionApplication(
      repository,
      featureFlags,
    );
  });

  describe("When the repository is empty", () => {
    test("returns empty list", async () => {
      const ImmersionApplications = await listImmersionApplication.execute();
      expect(ImmersionApplications).toEqual([]);
    });
  });

  describe("When a immersionApplication is stored", () => {
    test("returns the immersionApplication", async () => {
      const entity = new ImmersionApplicationEntityBuilder().build();
      repository.setDemandesImmersion({ form_id: entity });

      const ImmersionApplications = await listImmersionApplication.execute();
      expect(ImmersionApplications).toEqual([entity.toDto()]);
    });
  });
});
