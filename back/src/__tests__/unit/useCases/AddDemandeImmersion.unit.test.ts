import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { DemandeImmersionEntity } from "../../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { AddDemandeImmersion } from "../../../domain/demandeImmersion/useCases/AddDemandeImmersion";
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { DemandeImmersionDtoBuilder } from "../../../_testBuilders/DemandeImmersionDtoBuilder";
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Add demandeImmersion", () => {
  let addDemandeImmersion: AddDemandeImmersion;
  let repository: InMemoryDemandeImmersionRepository;
  let emailGateway: InMemoryEmailGateway;
  let featureFlags: FeatureFlags;
  let supervisorEmail: string | undefined;
  let emailAllowList: string[];
  const validDemandeImmersion = new DemandeImmersionDtoBuilder().build();

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    emailGateway = new InMemoryEmailGateway();
    featureFlags = new FeatureFlagsBuilder().build();
    supervisorEmail = undefined;
    emailAllowList = [];
  });

  const createAddDemandeImmersionUseCase = () => {
    return new AddDemandeImmersion({
      demandeImmersionRepository: repository,
      emailGateway,
      featureFlags,
      supervisorEmail,
      emailAllowList,
    });
  };

  describe("When enableGenericApplications is on", () => {
    beforeEach(() => {
      featureFlags = new FeatureFlagsBuilder()
        .enableGenericApplicationForm()
        .build();
      addDemandeImmersion = createAddDemandeImmersionUseCase();
    });

    test("saves valid applications in the repository", async () => {
      expect(await addDemandeImmersion.execute(validDemandeImmersion)).toEqual({
        id: validDemandeImmersion.id,
      });

      const storedInRepo = await repository.getAll();
      expect(storedInRepo.length).toBe(1);
      expect(storedInRepo[0].toDto()).toEqual(validDemandeImmersion);
    });

    test("sends no emails when supervisor and allowlist are not set", async () => {
      expect(
        await addDemandeImmersion.execute(validDemandeImmersion)
      ).not.toBeUndefined();
      expect(emailGateway.getSentEmails()).toHaveLength(0);
    });

    describe("When supervisor email is set", () => {
      beforeEach(() => {
        supervisorEmail = "supervisor@email.fr";
        addDemandeImmersion = createAddDemandeImmersionUseCase();
      });

      test("sends admin notification email when supervisor set", async () => {
        expect(
          await addDemandeImmersion.execute(validDemandeImmersion)
        ).not.toBeUndefined();

        const sentEmails = emailGateway.getSentEmails();
        expect(sentEmails).toHaveLength(1);

        expect(sentEmails[0].type).toEqual("NEW_DEMANDE_ADMIN_NOTIFICATION");
        expect(sentEmails[0].recipients).toContain("supervisor@email.fr");
        expect(sentEmails[0].params).toEqual({
          demandeId: validDemandeImmersion.id,
          firstName: validDemandeImmersion.firstName,
          lastName: validDemandeImmersion.lastName,
          dateStart: validDemandeImmersion.dateStart,
          dateEnd: validDemandeImmersion.dateEnd,
          businessName: validDemandeImmersion.businessName,
        });
      });
    });

    describe("When beneficiary email address is on allowlist", () => {
      beforeEach(() => {
        emailAllowList = ["beneficiaire@email.fr"];
        addDemandeImmersion = createAddDemandeImmersionUseCase();
      });

      test("sends beneficiary confirmation email", async () => {
        expect(
          await addDemandeImmersion.execute({
            ...validDemandeImmersion,
            email: "beneficiaire@email.fr",
          })
        ).not.toBeUndefined();

        const sentEmails = emailGateway.getSentEmails();
        expect(sentEmails).toHaveLength(1);

        expect(sentEmails[0].type).toEqual(
          "NEW_DEMANDE_BENEFICIAIRE_CONFIRMATION"
        );
        expect(sentEmails[0].recipients).toContain("beneficiaire@email.fr");
        expect(sentEmails[0].params).toEqual({
          demandeId: validDemandeImmersion.id,
          firstName: validDemandeImmersion.firstName,
          lastName: validDemandeImmersion.lastName,
        });
      });
    });

    test("rejects applications where the ID is already in use", async () => {
      await repository.save(
        DemandeImmersionEntity.create(validDemandeImmersion)
      );

      await expectPromiseToFailWithError(
        addDemandeImmersion.execute(validDemandeImmersion),
        new ConflictError(validDemandeImmersion.id)
      );
    });

    test("rejects applications with source != GENERIC", async () => {
      const application = new DemandeImmersionDtoBuilder()
        .withSource("NARBONNE")
        .build();

      await expectPromiseToFailWithError(
        addDemandeImmersion.execute(application),
        new FeatureDisabledError()
      );
    });
  });

  describe("When enableBoulogneSurMerApplicationForm is on", () => {
    beforeEach(() => {
      featureFlags = new FeatureFlagsBuilder()
        .enableBoulogneSurMerApplicationForm()
        .build();
      supervisorEmail = "supervisor@email.fr";
      emailAllowList = ["beneficiary@email.fr"];
      addDemandeImmersion = createAddDemandeImmersionUseCase();
    });

    test("accepts applications with source BOULOGNE_SUR_MER", async () => {
      const application = new DemandeImmersionDtoBuilder()
        .withSource("BOULOGNE_SUR_MER")
        .build();

      expect(() => addDemandeImmersion.execute(application)).not.toThrowError();
      expect(emailGateway.getSentEmails).toHaveLength(0);
    });

    test("rejects applications with source != BOULOGNE_SUR_MER", async () => {
      const application = new DemandeImmersionDtoBuilder()
        .withSource("GENERIC")
        .build();

      await expectPromiseToFailWithError(
        addDemandeImmersion.execute(application),
        new FeatureDisabledError()
      );
    });
  });

  describe("When enableNarbonneApplicationForm is on", () => {
    beforeEach(() => {
      featureFlags = new FeatureFlagsBuilder()
        .enableNarbonneApplicationForm()
        .build();
      supervisorEmail = "supervisor@email.fr";
      emailAllowList = ["beneficiary@email.fr"];
      addDemandeImmersion = createAddDemandeImmersionUseCase();
    });

    test("accepts applications with source NARBONNE", async () => {
      const application = new DemandeImmersionDtoBuilder()
        .withSource("NARBONNE")
        .build();

      expect(() => addDemandeImmersion.execute(application)).not.toThrowError();
      expect(emailGateway.getSentEmails).toHaveLength(0);
    });

    test("rejects applications with source != NARBONNE", async () => {
      const application = new DemandeImmersionDtoBuilder()
        .withSource("BOULOGNE_SUR_MER")
        .build();

      await expectPromiseToFailWithError(
        addDemandeImmersion.execute(application),
        new FeatureDisabledError()
      );
    });
  });
});
