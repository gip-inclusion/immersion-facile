import { FeatureDisabledError } from "../../shared/featureFlags";
import { expectPromiseToFailWithError } from "../../_testBuilders/test.helpers";
import { ApplicationRepositorySwitcher } from "../../adapters/secondary/ApplicationRepositorySwitcher";
import { InMemoryDemandeImmersionRepository } from "../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { DemandeImmersionDtoBuilder } from "../../_testBuilders/DemandeImmersionDtoBuilder";
describe("ApplicationRepositorySwitcher", () => {
  const genericApplication = DemandeImmersionEntity.create(
    new DemandeImmersionDtoBuilder()
      .withId("generic_id")
      .withSource("GENERIC")
      .build()
  );
  const narbonneApplication = DemandeImmersionEntity.create(
    new DemandeImmersionDtoBuilder()
      .withId("narbonne_id")
      .withSource("NARBONNE")
      .build()
  );
  const boulogneSurMerApplication = DemandeImmersionEntity.create(
    new DemandeImmersionDtoBuilder()
      .withId("boulogne_sur_mer_id")
      .withSource("BOULOGNE_SUR_MER")
      .build()
  );

  let genericRepository: InMemoryDemandeImmersionRepository;
  let narbonneRepository: InMemoryDemandeImmersionRepository;
  let demux: ApplicationRepositorySwitcher;

  beforeEach(() => {
    genericRepository = new InMemoryDemandeImmersionRepository();
    narbonneRepository = new InMemoryDemandeImmersionRepository();
    demux = new ApplicationRepositorySwitcher({
      GENERIC: genericRepository,
      NARBONNE: narbonneRepository,
    });
  });

  describe("save", () => {
    test("saves application to correct repository", async () => {
      // GENERIC repository
      expect(await demux.save(genericApplication)).toEqual(
        genericApplication.id
      );
      expect((await genericRepository.getAll())[0]).toEqual(genericApplication);

      // NARBONNE repository
      expect(await demux.save(narbonneApplication)).toEqual(
        narbonneApplication.id
      );
      expect((await narbonneRepository.getAll())[0]).toEqual(
        narbonneApplication
      );
    });

    test("returns undefined if application already exists", async () => {
      // GENERIC repository
      genericRepository.setDemandesImmersion({
        [genericApplication.id]: genericApplication,
      });
      expect(await demux.save(genericApplication)).toBeUndefined;

      // NARBONNE repository
      narbonneRepository.setDemandesImmersion({
        [narbonneApplication.id]: narbonneApplication,
      });
      expect(await demux.save(narbonneApplication)).toBeUndefined;
    });

    test("rejects applications from unsupported sources", async () => {
      await expectPromiseToFailWithError(
        demux.save(boulogneSurMerApplication),
        new FeatureDisabledError(boulogneSurMerApplication.source)
      );
    });
  });

  describe("getById", () => {
    test("returns the requested entity if found in one repository", async () => {
      genericRepository.setDemandesImmersion({
        [genericApplication.id]: genericApplication,
      });
      narbonneRepository.setDemandesImmersion({
        [narbonneApplication.id]: narbonneApplication,
      });

      expect(await demux.getById(genericApplication.id)).toEqual(
        genericApplication
      );
      expect(await demux.getById(narbonneApplication.id)).toEqual(
        narbonneApplication
      );
    });

    test("returns undefined if entity not found in any repository", async () => {
      expect(await demux.getById("unknown_id")).toBeUndefined();
    });

    test("fails if entity is found in multiple repositories", async () => {
      genericRepository.setDemandesImmersion({
        ["duplicate_id"]: genericApplication,
      });
      narbonneRepository.setDemandesImmersion({
        ["duplicate_id"]: narbonneApplication,
      });

      await expectPromiseToFailWithError(
        demux.getById("duplicate_id"),
        new Error("More results than expected: duplicate_id")
      );
    });

    describe("When there is no repository", () => {
      beforeEach(() => {
        demux = new ApplicationRepositorySwitcher({});
      });
      test("throws FeatureDisabledError", async () => {
        await expectPromiseToFailWithError(
          demux.getById("id"),
          new FeatureDisabledError()
        );
      });
    });
  });

  describe("getAll", () => {
    test("returns all entries in all repositories", async () => {
      genericRepository.setDemandesImmersion({
        [genericApplication.id]: genericApplication,
      });
      expect(await demux.getAll()).toEqual([genericApplication]);

      narbonneRepository.setDemandesImmersion({
        [narbonneApplication.id]: narbonneApplication,
      });
      expect(new Set(await demux.getAll())).toEqual(
        new Set([genericApplication, narbonneApplication])
      );

      const genericApplication2 = DemandeImmersionEntity.create(
        new DemandeImmersionDtoBuilder().withId("generic_id2").build()
      );
      genericRepository.setDemandesImmersion({
        [genericApplication.id]: genericApplication,
        [genericApplication2.id]: genericApplication2,
      });
      expect(new Set(await demux.getAll())).toEqual(
        new Set([genericApplication, genericApplication2, narbonneApplication])
      );
    });

    test("returns empty list when all repositories are empty", async () => {
      expect(await demux.getAll()).toEqual([]);
    });

    describe("When there is no repository", () => {
      beforeEach(() => {
        demux = new ApplicationRepositorySwitcher({});
      });
      test("throws FeatureDisabledError", async () => {
        await expectPromiseToFailWithError(
          demux.getAll(),
          new FeatureDisabledError()
        );
      });
    });
  });

  describe("updateDemandeImmersion", () => {
    test("updates application in the correct repository", async () => {
      // GENERIC repository
      genericRepository.setDemandesImmersion({
        [genericApplication.id]: genericApplication,
      });
      const updatedGenericApplication = DemandeImmersionEntity.create({
        ...genericApplication.toDto(),
        email: "new@generic.email.fr",
      });
      expect(
        await demux.updateDemandeImmersion(updatedGenericApplication)
      ).toEqual(updatedGenericApplication.id);
      expect((await genericRepository.getAll())[0]).toEqual(
        updatedGenericApplication
      );

      // NARBONNE repository
      narbonneRepository.setDemandesImmersion({
        [narbonneApplication.id]: narbonneApplication,
      });
      const updatedNarbonneApplication = DemandeImmersionEntity.create({
        ...narbonneApplication.toDto(),
        email: "new@narbonne.email.fr",
      });
      expect(
        await demux.updateDemandeImmersion(updatedNarbonneApplication)
      ).toEqual(updatedNarbonneApplication.id);
      expect((await narbonneRepository.getAll())[0]).toEqual(
        updatedNarbonneApplication
      );
    });

    test("returns undefined if application doesn't exist", async () => {
      expect(
        await demux.updateDemandeImmersion(genericApplication)
      ).toBeUndefined();
      expect(await genericRepository.getAll()).toEqual([]);

      expect(
        await demux.updateDemandeImmersion(narbonneApplication)
      ).toBeUndefined();
      expect(await narbonneRepository.getAll()).toEqual([]);
    });

    test("rejects application updates in unsupported sources", async () => {
      await expectPromiseToFailWithError(
        demux.updateDemandeImmersion(boulogneSurMerApplication),
        new FeatureDisabledError(boulogneSurMerApplication.source)
      );
    });
  });
});
