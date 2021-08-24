import { SireneRepository } from "../../domain/sirene/ports/SireneRepository";

export const TEST_ESTABLISHMENT1_SIRET = "12345678901234";
export const TEST_ESTABLISHMENT1 = {
  siren: "123456789",
  nic: "01234",
  siret: TEST_ESTABLISHMENT1_SIRET,
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
};

type Repo = { [siret: string]: Object };

export class InMemorySireneRepository implements SireneRepository {
  private readonly _repo: Repo = {};

  public constructor() {
    this._repo[TEST_ESTABLISHMENT1_SIRET] = TEST_ESTABLISHMENT1;
  }

  public async get(siret: string): Promise<Object | undefined> {
    const establishment = this._repo[siret];
    if (!establishment) {
      return undefined;
    }
    return {
      header: {
        statut: 200,
        message: "OK",
        total: 1,
        debut: 0,
        nombre: 1,
      },
      etablissements: [establishment],
    };
  }
}
