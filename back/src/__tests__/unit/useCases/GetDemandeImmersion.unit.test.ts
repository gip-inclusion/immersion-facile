import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { GetImmersionApplication } from "../../../domain/immersionApplication/useCases/GetImmersionApplication";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Get ImmersionApplication", () => {
  let getImmersionApplication: GetImmersionApplication;
  let repository: InMemoryImmersionApplicationRepository;

  beforeEach(() => {
    repository = new InMemoryImmersionApplicationRepository();
    getImmersionApplication = new GetImmersionApplication(repository);
  });

  describe("When the ImmersionApplication does not exist", () => {
    it("throws NotFoundError", async () => {
      expectPromiseToFailWithError(
        getImmersionApplication.execute({ id: "unknown_demande_immersion_id" }),
        new NotFoundError("unknown_demande_immersion_id"),
      );
    });
  });

  describe("When a ImmersionApplication is stored", () => {
    it("returns the ImmersionApplication", async () => {
      const entity = new ImmersionApplicationEntityBuilder().build();
      repository.setImmersionApplications({ [entity.id]: entity });

      const immersionApplication = await getImmersionApplication.execute({
        id: entity.id,
      });
      expect(immersionApplication).toEqual(entity.toDto());
    });
  });
});
