import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryConventionQueries } from "../../../adapters/secondary/InMemoryConventionQueries";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { GetConvention } from "../../../domain/convention/useCases/GetConvention";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Get Convention", () => {
  let getConvention: GetConvention;
  let repo: InMemoryConventionRepository;
  let queries: InMemoryConventionQueries;

  beforeEach(() => {
    repo = new InMemoryConventionRepository();
    queries = new InMemoryConventionQueries(repo);
    getConvention = new GetConvention(queries);
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
      repo.setConventions({ [entity.id]: entity });

      const convention = await getConvention.execute({
        id: entity.id,
      });
      expect(convention).toEqual(entity);
    });
  });
});
