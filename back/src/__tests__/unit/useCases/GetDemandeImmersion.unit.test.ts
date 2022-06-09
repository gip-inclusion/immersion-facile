import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { GetImmersionApplication } from "../../../domain/convention/useCases/GetImmersionApplication";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Get Convention", () => {
  let getConvention: GetImmersionApplication;
  let repository: InMemoryConventionRepository;

  beforeEach(() => {
    repository = new InMemoryConventionRepository();
    getConvention = new GetImmersionApplication(repository);
  });

  describe("When the Convention does not exist", () => {
    it("throws NotFoundError", async () => {
      await expectPromiseToFailWithError(
        getConvention.execute({ id: "unknown_demande_immersion_id" }),
        new NotFoundError("unknown_demande_immersion_id"),
      );
    });
  });

  describe("When a Convention is stored", () => {
    it("returns the Convention", async () => {
      const entity = new ConventionDtoBuilder().build();
      repository.setConventions({ [entity.id]: entity });

      const convention = await getConvention.execute({
        id: entity.id,
      });
      expect(convention).toEqual(entity);
    });
  });
});
