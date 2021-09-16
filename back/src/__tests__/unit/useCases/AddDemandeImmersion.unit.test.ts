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
import { ApplicationSource } from "./../../../shared/DemandeImmersionDto";

describe("Add demandeImmersion", () => {
  let addDemandeImmersion: AddDemandeImmersion;
  let genericRepository: InMemoryDemandeImmersionRepository;
  let boulogneSurMerRepository: InMemoryDemandeImmersionRepository;
  let narbonneRepository: InMemoryDemandeImmersionRepository;
  let emailGateway: InMemoryEmailGateway;
  let featureFlags: FeatureFlags;
  let supervisorEmail: string | undefined;
  let unrestrictedEmailSendingSources: Set<ApplicationSource>;
  let emailAllowList: Set<string>;
  const validDemandeImmersion = new DemandeImmersionDtoBuilder().build();

  beforeEach(() => {
    genericRepository = new InMemoryDemandeImmersionRepository();
    boulogneSurMerRepository = new InMemoryDemandeImmersionRepository();
    narbonneRepository = new InMemoryDemandeImmersionRepository();
    emailGateway = new InMemoryEmailGateway();
    featureFlags = new FeatureFlagsBuilder().build();
    supervisorEmail = undefined;
    unrestrictedEmailSendingSources = new Set<ApplicationSource>();
    emailAllowList = new Set<string>();
  });

  const createAddDemandeImmersionUseCase = () => {
    return new AddDemandeImmersion({
      genericRepository: genericRepository,
      boulogneSurMerRepository,
      narbonneRepository,
      emailGateway,
      featureFlags,
      supervisorEmail,
      unrestrictedEmailSendingSources,
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

      const storedInRepo = await genericRepository.getAll();
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

        expect(sentEmails[0].type).toEqual(
          "NEW_APPLICATION_ADMIN_NOTIFICATION"
        );
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

    describe("When beneficiary email address is on the allowlist", () => {
      beforeEach(() => {
        emailAllowList.add("beneficiary@email.fr");
        addDemandeImmersion = createAddDemandeImmersionUseCase();
      });

      test("sends the beneficiary confirmation email", async () => {
        expect(
          await addDemandeImmersion.execute({
            ...validDemandeImmersion,
            email: "beneficiary@email.fr",
          })
        ).not.toBeUndefined();

        const sentEmails = emailGateway.getSentEmails();
        expect(sentEmails).toHaveLength(1);

        expect(sentEmails[0].type).toEqual(
          "NEW_APPLICATION_BENEFICIARY_CONFIRMATION"
        );
        expect(sentEmails[0].recipients).toContain("beneficiary@email.fr");
        expect(sentEmails[0].params).toEqual({
          demandeId: validDemandeImmersion.id,
          firstName: validDemandeImmersion.firstName,
          lastName: validDemandeImmersion.lastName,
        });
      });
    });

    describe("When mentor email address is on the allowlist", () => {
      beforeEach(() => {
        emailAllowList.add("mentor@email.fr");
        addDemandeImmersion = createAddDemandeImmersionUseCase();
      });

      test("sends the mentor confirmation email", async () => {
        expect(
          await addDemandeImmersion.execute({
            ...validDemandeImmersion,
            mentorEmail: "mentor@email.fr",
          })
        ).not.toBeUndefined();

        const sentEmails = emailGateway.getSentEmails();
        expect(sentEmails).toHaveLength(1);

        expect(sentEmails[0].type).toEqual(
          "NEW_APPLICATION_MENTOR_CONFIRMATION"
        );
        expect(sentEmails[0].recipients).toContain("mentor@email.fr");
        expect(sentEmails[0].params).toEqual({
          demandeId: validDemandeImmersion.id,
          mentorName: validDemandeImmersion.mentor,
          beneficiaryFirstName: validDemandeImmersion.firstName,
          beneficiaryLastName: validDemandeImmersion.lastName,
        });
      });
    });

    describe("When unrestricted email sending is enabled", () => {
      beforeEach(() => {
        unrestrictedEmailSendingSources.add("GENERIC");
        addDemandeImmersion = createAddDemandeImmersionUseCase();
      });

      test("sends the beneficiary and mentor confirmation emails", async () => {
        expect(
          await addDemandeImmersion.execute({
            ...validDemandeImmersion,
            email: "beneficiary@email.fr",
            mentorEmail: "mentor@email.fr",
          })
        ).not.toBeUndefined();

        const sentEmails = emailGateway.getSentEmails();
        expect(sentEmails.map((email) => email.type)).toEqual([
          "NEW_APPLICATION_BENEFICIARY_CONFIRMATION",
          "NEW_APPLICATION_MENTOR_CONFIRMATION",
        ]);
      });
    });

    test("rejects applications where the ID is already in use", async () => {
      await genericRepository.save(
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
      unrestrictedEmailSendingSources.add("BOULOGNE_SUR_MER");
      addDemandeImmersion = createAddDemandeImmersionUseCase();
    });

    test("accepts applications with source BOULOGNE_SUR_MER", async () => {
      const application = new DemandeImmersionDtoBuilder()
        .withSource("BOULOGNE_SUR_MER")
        .build();

      await expect(() =>
        addDemandeImmersion.execute(application)
      ).not.toThrowError();
      expect(await genericRepository.getAll()).toHaveLength(0);
      expect(await boulogneSurMerRepository.getAll()).toHaveLength(1);
      expect(emailGateway.getSentEmails().map((email) => email.type)).toEqual([
        "NEW_APPLICATION_BENEFICIARY_CONFIRMATION",
        "NEW_APPLICATION_MENTOR_CONFIRMATION",
      ]);
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
      unrestrictedEmailSendingSources.add("NARBONNE");
      addDemandeImmersion = createAddDemandeImmersionUseCase();
    });

    test("accepts applications with source NARBONNE", async () => {
      const application = new DemandeImmersionDtoBuilder()
        .withSource("NARBONNE")
        .build();

      await expect(() =>
        addDemandeImmersion.execute(application)
      ).not.toThrowError();
      expect(await genericRepository.getAll()).toHaveLength(0);
      expect(await narbonneRepository.getAll()).toHaveLength(1);
      expect(emailGateway.getSentEmails().map((email) => email.type)).toEqual([
        "NEW_APPLICATION_BENEFICIARY_CONFIRMATION",
        "NEW_APPLICATION_MENTOR_CONFIRMATION",
      ]);
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
