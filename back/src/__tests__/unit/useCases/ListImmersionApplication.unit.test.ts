import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { ListImmersionApplication } from "../../../domain/immersionApplication/useCases/ListImmersionApplication";
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("List Immersion Applications", () => {
  let listImmersionApplication: ListImmersionApplication;
  let repository: InMemoryImmersionApplicationRepository;
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    repository = new InMemoryImmersionApplicationRepository();
    featureFlags = FeatureFlagsBuilder.allOff().build();
  });

  const createListImmersionApplicationUseCase = () => {
    return new ListImmersionApplication({
      immersionApplicationRepository: repository,
      featureFlags,
    });
  };

  describe("When enableViewableApplication in on", () => {
    beforeEach(() => {
      featureFlags = FeatureFlagsBuilder.allOff()
        .enableViewableApplications()
        .build();
      listImmersionApplication = createListImmersionApplicationUseCase();
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

  describe("When demandeImmersionRepository is off", () => {
    beforeEach(() => {
      featureFlags = FeatureFlagsBuilder.allOff().build();
      listImmersionApplication = createListImmersionApplicationUseCase();
    });

    it("throws FeatureDisabledError", async () => {
      expectPromiseToFailWithError(
        listImmersionApplication.execute(),
        new FeatureDisabledError(),
      );
    });
  });
});
