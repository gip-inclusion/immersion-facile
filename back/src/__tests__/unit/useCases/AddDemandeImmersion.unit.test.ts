import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { AddDemandeImmersion } from "../../../domain/demandeImmersion/useCases/AddDemandeImmersion";
import { DemandeImmersionDtoBuilder } from "../../../_testBuilders/DemandeImmersionDtoBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { DemandeImmersionEntity } from "./../../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { ApplicationSource } from "./../../../shared/DemandeImmersionDto";

describe("Add demandeImmersion", () => {
  let addDemandeImmersion: AddDemandeImmersion;
  let applicationRepository: InMemoryDemandeImmersionRepository;
  let emailGateway: InMemoryEmailGateway;
  let supervisorEmail: string | undefined;
  let unrestrictedEmailSendingSources: Set<ApplicationSource>;
  let emailAllowList: Set<string>;
  const validDemandeImmersion = new DemandeImmersionDtoBuilder().build();

  beforeEach(() => {
    applicationRepository = new InMemoryDemandeImmersionRepository();
    emailGateway = new InMemoryEmailGateway();
    supervisorEmail = undefined;
    unrestrictedEmailSendingSources = new Set<ApplicationSource>();
    emailAllowList = new Set<string>();
    addDemandeImmersion = createAddDemandeImmersionUseCase();
  });

  const createAddDemandeImmersionUseCase = () => {
    return new AddDemandeImmersion({
      applicationRepository,
      emailGateway,
      supervisorEmail,
      unrestrictedEmailSendingSources,
      emailAllowList,
    });
  };

  test("saves valid applications in the repository", async () => {
    expect(await addDemandeImmersion.execute(validDemandeImmersion)).toEqual({
      id: validDemandeImmersion.id,
    });

    const storedInRepo = await applicationRepository.getAll();
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

    test("sends admin notification email when source == GENERIC", async () => {
      expect(
        await addDemandeImmersion.execute(validDemandeImmersion)
      ).not.toBeUndefined();

      const sentEmails = emailGateway.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expect(sentEmails[0].type).toEqual("NEW_APPLICATION_ADMIN_NOTIFICATION");
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
    test("sends no admin notification email when source != GENERIC", async () => {
      const application = new DemandeImmersionDtoBuilder()
        .withSource("NARBONNE")
        .build();

      expect(
        await addDemandeImmersion.execute(application)
      ).not.toBeUndefined();
      expect(emailGateway.getSentEmails()).toHaveLength(0);
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

      expect(sentEmails[0].type).toEqual("NEW_APPLICATION_MENTOR_CONFIRMATION");
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
    await applicationRepository.save(
      DemandeImmersionEntity.create(validDemandeImmersion)
    );

    await expectPromiseToFailWithError(
      addDemandeImmersion.execute(validDemandeImmersion),
      new ConflictError(validDemandeImmersion.id)
    );
  });
});
