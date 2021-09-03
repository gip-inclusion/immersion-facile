import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { expectPromiseToFailWithError } from "../../../utils/test.helpers";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { validDemandeImmersion } from "../entities/DemandeImmersionIdEntityTestData";
import { GetDemandeImmersion } from "./GetDemandeImmersion";

describe("Get DemandeImmersion", () => {
  let repository: InMemoryDemandeImmersionRepository;
  let getDemandeImmersion: GetDemandeImmersion;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    getDemandeImmersion = new GetDemandeImmersion({
      demandeImmersionRepository: repository,
    });
  });

  describe("When the DemandeImmersion does not exist", () => {
    it("throws NotFoundError", async () => {
      expectPromiseToFailWithError(
        getDemandeImmersion.execute({ id: "unknown_demande_immersion_id" }),
        new NotFoundError("unknown_demande_immersion_id")
      );
    });
  });

  describe("When a DemandeImmersion is stored", () => {
    it("returns the DemandeImmersion", async () => {
      repository.setDemandesImmersion({
        test_id: DemandeImmersionEntity.create(validDemandeImmersion),
      });

      const demandeImmersion = await getDemandeImmersion.execute({
        id: "test_id",
      });
      expect(demandeImmersion).toEqual(validDemandeImmersion);
    });
  });
});
