import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import type { FormulaireDto, AddFormulaireResponseDto, UpdateFormulaireResponseDto } from "src/shared/FormulaireDto";

const FORMULAIRE_ID = "fake-test-id";
const TEST_ESTABLISHMENT1_SIRET = "12345678901234";
const TEST_ESTABLISHMENT1 = {
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

export class InMemoryFormulaireGateway implements FormulaireGateway {
  constructor(private _formulaires: FormulaireDto[] = []) { }

  public async add(formulaire: FormulaireDto): Promise<string> {
    console.log("InMemoryFormulaireGateway.add: ", formulaire);
    this._formulaires.push(formulaire);
    return FORMULAIRE_ID;
  }

  public async get(id: string): Promise<FormulaireDto> {
    console.log("InMemoryFormulaireGateway.get: ", id);
    return this._formulaires[0];
  }

  public async update(id: string, formulaire: FormulaireDto): Promise<string> {
    console.log("InMemoryFormulaireGateway.update: ", formulaire);
    this._formulaires[0] = formulaire;
    return FORMULAIRE_ID;
  }

  public async getSiretInfo(siret: string): Promise<Object> {
    console.log("InMemoryFormulaireGateway.getSiretInfo: " + siret);

    if (siret !== TEST_ESTABLISHMENT1_SIRET) {
      throw new Error("404 Not found")
    }

    return {
      header: {
        statut: 200,
        message: "OK",
        total: 1,
        debut: 0,
        nombre: 1,
      },
      etablissements: [TEST_ESTABLISHMENT1],
    };
  }

}
