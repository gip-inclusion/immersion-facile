import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { expectPromiseToFailWithError } from "../../../utils/test.helpers";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { validDemandeImmersion } from "../entities/DemandeImmersionIdEntityTestData";
import { AddDemandeImmersion } from "./AddDemandeImmersion";

describe("Add demandeImmersion", () => {
  let repository: InMemoryDemandeImmersionRepository;
  let emailGateway: InMemoryEmailGateway;
  let addDemandeImmersion: AddDemandeImmersion;
  let supervisorEmail: string;
  let emailAllowlist: string[];

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    emailGateway = new InMemoryEmailGateway();
    addDemandeImmersion = new AddDemandeImmersion({
      demandeImmersionRepository: repository,
      emailGateway,
      supervisorEmail,
      emailAllowlist,
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

  describe("Noticiation emails", () => {
    test("Sends no emails when supervisor and allowlist are not set", async () => {
      expect(
        await addDemandeImmersion.execute(validDemandeImmersion)
      ).not.toBeUndefined();
      expect(emailGateway.getSentEmails()).toHaveLength(0);
    });

    test("Sends supervisor email when supervisor set", async () => {
      addDemandeImmersion = new AddDemandeImmersion({
        demandeImmersionRepository: repository,
        emailGateway,
        supervisorEmail: "supervisor@email.fr",
        emailAllowlist,
      });

      expect(
        await addDemandeImmersion.execute(validDemandeImmersion)
      ).not.toBeUndefined();

      const sentEmails = emailGateway.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expect(sentEmails[0].recipient).toEqual("supervisor@email.fr");
      expect(sentEmails[0].subject).toEqual(
        "Nouvelle demande d'immersion: " +
          `${validDemandeImmersion.lastName}, ${validDemandeImmersion.firstName}` +
          ` - ${validDemandeImmersion.businessName}`
      );
      expect(sentEmails[0].textContent).toEqual(
        `Détails sur: https://immersion.beta.pole-emploi.fr/demande-immersion` +
          `?demandeId=${validDemandeImmersion.id}`
      );
    });

    test("Sends bénéficiaire email when on allowlist", async () => {
      addDemandeImmersion = new AddDemandeImmersion({
        demandeImmersionRepository: repository,
        emailGateway,
        supervisorEmail,
        emailAllowlist: ["bénéficiaire@email.fr"],
      });

      expect(
        await addDemandeImmersion.execute({
          ...validDemandeImmersion,
          email: "bénéficiaire@email.fr",
        })
      ).not.toBeUndefined();

      const sentEmails = emailGateway.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expect(sentEmails[0].recipient).toEqual("bénéficiaire@email.fr");
      expect(sentEmails[0].subject).toEqual("Votre demande d'immersion a été enregistrée");
      expect(sentEmails[0].textContent).toEqual(
        "Merci d'avoir enregistré votre demande. Vous pouvez la modifier avec le lien suivant: " +
          `https://immersion.beta.pole-emploi.fr/demande-immersion` +
          `?demandeId=${validDemandeImmersion.id}`
      );
    });
  });

  describe("When a demande d'immersion with the given ID already exists", () => {
    test("throws a ConflictError", async () => {
      await repository.save(
        DemandeImmersionEntity.create(validDemandeImmersion)
      );

      expectPromiseToFailWithError(
        addDemandeImmersion.execute(validDemandeImmersion),
        new ConflictError(validDemandeImmersion.id)
      );
    });
  });
});
