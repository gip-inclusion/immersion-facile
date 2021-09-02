import { NotFoundError } from "src/adapters/primary/helpers/sendHttpResponse";
import { InMemoryDemandeImmersionRepository } from "src/adapters/secondary/InMemoryDemandeImmersionRepository";
import { expectPromiseToFailWithError } from "src/utils/test.helpers";
import { DemandeImmersionEntity } from "src/domain/demandeImmersion/entities/DemandeImmersionEntity";
import { validDemandeImmersion } from "src/domain/demandeImmersion/entities/DemandeImmersionIdEntityTestData";
import { GetDemandeImmersion } from "src/domain/demandeImmersion/useCases/GetDemandeImmersion";

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
      await expectPromiseToFailWithError(
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
