import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
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
    getSiret = new GetSiret({ sireneRepository: repository });
  });

  describe("When the siret does not exist", () => {
    it("throws NotFoundError", async () => {
      expectPromiseToFailWithError(
        getSiret.execute("unknown_siret"),
        new NotFoundError("unknown_siret")
      );
    });
  });

  describe("When a demandeImmersion is stored", () => {
    it("returns the demandeImmersion", async () => {
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
