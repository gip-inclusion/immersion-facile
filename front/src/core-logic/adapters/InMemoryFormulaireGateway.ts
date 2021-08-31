import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import { FormulaireDto, FormulaireStatus } from "src/shared/FormulaireDto";

const NEW_FORMULAIRE_ID = "fake-test-id";

const FORMULAIRE_TEMPLATE: FormulaireDto = {
  status: FormulaireStatus.DRAFT,
  email: "esteban@ocon.fr",
  phone: "+33012345678",
  firstName: "Esteban",
  lastName: "Ocon",
  dateSubmission: "2021-07-01",
  dateStart: "2021-08-01",
  dateEnd: "2021-08-31",
  businessName: "Beta.gouv.fr",
  siret: "12345678901234",
  mentor: "Alain Prost",
  mentorPhone: "0601010101",
  mentorEmail: "alain@prost.fr",
  workdays: ["jeudi", "vendredi", "samedi", "dimanche"],
  workHours: "9h00-17h00",
  immersionAddress: "",
  individualProtection: true,
  sanitaryPrevention: true,
  sanitaryPreventionDescription: "fourniture de gel",
  immersionObjective: "Confirmer un projet professionnel",
  immersionProfession: "Pilote d'automobile",
  immersionActivities: "Piloter un automobile",
  immersionSkills: "Utilisation des pneus optimale, gestion de carburant",
  beneficiaryAccepted: true,
  enterpriseAccepted: true,
} as FormulaireDto;

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
  private _formulaires: { [id: string]: FormulaireDto } = {};

  public constructor() {
    this._formulaires["valid_draft"] = {
      ...FORMULAIRE_TEMPLATE,
      email: "DRAFT.esteban@ocon.fr",
      status: FormulaireStatus.DRAFT,
    }
    this._formulaires["valid_finalized"] = {
      ...FORMULAIRE_TEMPLATE,
      email: "FINALIZED.esteban@ocon.fr",
      status: FormulaireStatus.FINALIZED,
    }
  }

  public async add(formulaire: FormulaireDto): Promise<string> {
    console.log("InMemoryFormulaireGateway.add: ", formulaire);
    this._formulaires[NEW_FORMULAIRE_ID] = formulaire;
    return NEW_FORMULAIRE_ID;
  }

  public async get(id: string): Promise<FormulaireDto> {
    console.log("InMemoryFormulaireGateway.get: ", id);
    return this._formulaires[id];
  }

  public async getAll(): Promise<Array<FormulaireDto>> {
    console.log("InMemoryFormulaireGateway.getAll");
    const formulaires = [];
    for (let id in this._formulaires) {
      formulaires.push(this._formulaires[id]);
    }
    return formulaires;
  }

  public async update(id: string, formulaire: FormulaireDto): Promise<string> {
    console.log("InMemoryFormulaireGateway.update: ", formulaire);
    this._formulaires[id] = formulaire;
    return NEW_FORMULAIRE_ID;
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
