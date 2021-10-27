import {
  SireneRepository,
  SiretResponse,
} from "../../domain/sirene/ports/SireneRepository";
import { SiretDto } from "../../shared/siret";
import { Establishment } from "./../../domain/sirene/ports/SireneRepository";

export const TEST_ESTABLISHMENT1: Establishment = {
  siret: "12345678901234",
  uniteLegale: {
    denominationUniteLegale: "MA P'TITE BOITE",
    activitePrincipaleUniteLegale: "78.3Z",
    nomenclatureActivitePrincipaleUniteLegale: "Ref2",
  },
  adresseEtablissement: {
    numeroVoieEtablissement: "20",
    typeVoieEtablissement: "AVENUE",
    libelleVoieEtablissement: "DE SEGUR",
    codePostalEtablissement: "75007",
    libelleCommuneEtablissement: "PARIS 7",
  },
};

export class InMemorySireneRepository implements SireneRepository {
  private readonly _repo = {
    [TEST_ESTABLISHMENT1.siret]: TEST_ESTABLISHMENT1,
  };

  public constructor() {}

  public async get(siret: SiretDto): Promise<SiretResponse | undefined> {
    const establishment = this._repo[siret];
    if (!establishment) return undefined;
    return {
      etablissements: [establishment],
    };
  }

  // Visible for testing
  public add(establishment: Establishment) {
    this._repo[establishment.siret] = establishment;
  }
}
