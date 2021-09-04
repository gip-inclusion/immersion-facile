import { DemandeImmersionDtoBuilder } from "../../../_testBuilders/DemandeImmersionDtoBuilder";
import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { DemandeImmersionEntity } from "../../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { AddDemandeImmersion } from "../../../domain/demandeImmersion/useCases/AddDemandeImmersion";

describe("Add demandeImmersion", () => {
  let repository: InMemoryDemandeImmersionRepository;
  let emailGateway: InMemoryEmailGateway;
  let addDemandeImmersion: AddDemandeImmersion;
  let supervisorEmail: string;
  let emailAllowList: string[];
  const validDemandeImmersion = new DemandeImmersionDtoBuilder().build();

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    emailGateway = new InMemoryEmailGateway();
    addDemandeImmersion = new AddDemandeImmersion({
      demandeImmersionRepository: repository,
      emailGateway,
      supervisorEmail,
      emailAllowList,
    });
  });

  describe("When the demandeImmersion is valid", () => {
    test("saves the demandeImmersion in the repository", async () => {
      expect(await addDemandeImmersion.execute(validDemandeImmersion)).toEqual({
        id: validDemandeImmersion.id,
      });

      const storedInRepo = await repository.getAll();
      expect(storedInRepo.length).toBe(1);
      expect(storedInRepo[0].toDto()).toEqual(validDemandeImmersion);
    });
  });

  describe("Notification emails", () => {
    test("Sends no emails when supervisor and allowlist are not set", async () => {
      expect(
        await addDemandeImmersion.execute(validDemandeImmersion)
      ).not.toBeUndefined();
      expect(emailGateway.getSentEmails()).toHaveLength(0);
    });

    test("Sends admin notification email when supervisor set", async () => {
      addDemandeImmersion = new AddDemandeImmersion({
        demandeImmersionRepository: repository,
        emailGateway,
        supervisorEmail: "supervisor@email.fr",
        emailAllowList,
      });

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

    test("Sends bénéficiaire confirmation email when on allowlist", async () => {
      addDemandeImmersion = new AddDemandeImmersion({
        demandeImmersionRepository: repository,
        emailGateway,
        supervisorEmail,
        emailAllowList: ["beneficiaire@email.fr"],
      });

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

  describe("When a demande d'immersion with the given ID already exists", () => {
    test("throws a ConflictError", async () => {
      await repository.save(
        DemandeImmersionEntity.create(validDemandeImmersion)
      );

      await expectPromiseToFailWithError(
        addDemandeImmersion.execute(validDemandeImmersion),
        new ConflictError(validDemandeImmersion.id)
      );
    });
  });
});
