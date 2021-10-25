import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  InMemorySireneRepository,
  TEST_ESTABLISHMENT1,
  TEST_ESTABLISHMENT1_SIRET,
} from "../../../adapters/secondary/InMemorySireneRepository";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { GetSiret } from "../../../domain/sirene/useCases/GetSiret";

describe("Get SIRET", () => {
  let repository: InMemorySireneRepository;
  let getSiret: GetSiret;

  beforeEach(() => {
    repository = new InMemorySireneRepository();
    getSiret = new GetSiret(repository);
  });

  describe("When the siret does not exist", () => {
    it("throws NotFoundError", async () => {
      await expectPromiseToFailWithError(
        getSiret.execute("40440440440400"),
        new NotFoundError("40440440440400"),
      );
    });
  });

  describe("When a immersionApplication is stored", () => {
    it("returns the immersionApplication", async () => {
      const response = await getSiret.execute(TEST_ESTABLISHMENT1_SIRET);
      expect(response).toEqual({
        header: {
          statut: 200,
          message: "OK",
          total: 1,
          debut: 0,
          nombre: 1,
        },
        etablissements: [TEST_ESTABLISHMENT1],
      });
    });
  });
});
