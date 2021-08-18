import { AddFormulaire } from "./AddFormulaire";
import {
  FakeIdGenerator,
  InMemoryFormulaireRepository,
} from "../../../adapters/secondary/InMemoryFormulaireRepository";
import { validFormulaire } from "../entities/FormulaireEntityTestData";

describe("Add Formulaire", () => {
  const FORMULAIRE_ID = "some_id";

  let idGenerator: FakeIdGenerator;
  let repository: InMemoryFormulaireRepository;
  let addFormulaire: AddFormulaire;

  beforeEach(() => {
    idGenerator = new FakeIdGenerator();
    repository = new InMemoryFormulaireRepository(idGenerator);
    addFormulaire = new AddFormulaire({ formulaireRepository: repository });
  });

  describe("When the formulaire is valid", () => {
    test("saves the formulaire in the repository", async () => {
      idGenerator.id = FORMULAIRE_ID;

      expect(
        await addFormulaire.execute(validFormulaire)
      ).toEqual({ id: FORMULAIRE_ID });

      expect(await repository.getAllFormulaires()).toEqual([
        validFormulaire,
      ]);
    });
  });
});
