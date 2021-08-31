import { AddDemandeImmersion } from "./AddDemandeImmersion";
import {
  FakeIdGenerator,
  InMemoryDemandeImmersionRepository,
} from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { validDemandeImmersion } from "../entities/DemandeImmersionIdEntityTestData";

describe("Add demandeImmersion", () => {
  const DEMANDE_IMMERSION_ID = "some_id";

  let idGenerator: FakeIdGenerator;
  let repository: InMemoryDemandeImmersionRepository;
  let addDemandeImmersion: AddDemandeImmersion;

  beforeEach(() => {
    idGenerator = new FakeIdGenerator();
    repository = new InMemoryDemandeImmersionRepository(idGenerator);
    addDemandeImmersion = new AddDemandeImmersion({
      demandeImmersionRepository: repository,
    });
  });

  describe("When the demandeImmersion is valid", () => {
    test("saves the demandeImmersion in the repository", async () => {
      idGenerator.id = DEMANDE_IMMERSION_ID;

      expect(await addDemandeImmersion.execute(validDemandeImmersion)).toEqual({
        id: DEMANDE_IMMERSION_ID,
      });

      const storedInRepo = await repository.getAll();
      expect(storedInRepo.length).toBe(1);
      expect(storedInRepo[0].toDto()).toEqual(validDemandeImmersion);
    });
  });
});
