import { DemandeImmersionDto, DemandeImmersionId } from "src/shared/DemandeImmersionDto";
import { DemandeImmersionGateway } from "src/core-logic/ports/DemandeImmersionGateway";

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

export class InMemoryDemandeImmersionGateway
  implements DemandeImmersionGateway
{
  private _demandesImmersion: DemandeImmersionDto[] = [];

  public async add(demandeImmersion: DemandeImmersionDto): Promise<DemandeImmersionId> {
    console.log("InMemoryDemandeImmersionGateway.add: ", demandeImmersion);
    this._demandesImmersion.push(demandeImmersion);
    return demandeImmersion.id;
  }

  public async get(id: DemandeImmersionId): Promise<DemandeImmersionDto> {
    console.log("InMemoryDemandeImmersionGateway.get: ", id);
    return this._demandesImmersion[0];
  }

  public async getAll(): Promise<Array<DemandeImmersionDto>> {
    console.log("InMemoryFormulaireGateway.getAll");
    return this._demandesImmersion;
  }

  public async update(demandeImmersion: DemandeImmersionDto): Promise<DemandeImmersionId> {
    console.log("InMemoryDemandeImmersionGateway.update: ", demandeImmersion);
    this._demandesImmersion[0] = demandeImmersion;
    return demandeImmersion.id;
  }

  public async getSiretInfo(siret: string): Promise<Object> {
    console.log("InMemoryDemandeImmersionGateway.getSiretInfo: " + siret);

    if (siret !== TEST_ESTABLISHMENT1_SIRET) {
      throw new Error("404 Not found");
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
