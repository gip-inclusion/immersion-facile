import { DemandeImmersionGateway } from "src/core-logic/ports/DemandeImmersionGateway";
import {
  DemandeImmersionDto,
  DemandeImmersionId,
} from "src/shared/DemandeImmersionDto";
import { FeatureFlags } from "src/shared/featureFlags";
import { reasonableSchedule } from "src/shared/ScheduleSchema";
import { sleep } from "src/shared/utils";

const DEMANDE_IMMERSION_TEMPLATE: DemandeImmersionDto = {
  id: "fake-test-id",
  status: "DRAFT",
  source: "GENERIC",
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
  schedule: reasonableSchedule,
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
};

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

const SIMULATED_LATENCY_MS = 2000;

export class InMemoryDemandeImmersionGateway
  implements DemandeImmersionGateway
{
  private _demandesImmersion: { [id: string]: DemandeImmersionDto } = {};

  public constructor(readonly featureFlags: FeatureFlags) {
    this.add({
      ...DEMANDE_IMMERSION_TEMPLATE,
      id: "valid_draft",
      status: "DRAFT",
      email: "DRAFT.esteban@ocon.fr",
    });
    this.add({
      ...DEMANDE_IMMERSION_TEMPLATE,
      id: "valid_finalized",
      status: "FINALIZED",
      email: "FINALIZED.esteban@ocon.fr",
    });
  }

  public async add(
    demandeImmersion: DemandeImmersionDto
  ): Promise<DemandeImmersionId> {
    console.log("InMemoryDemandeImmersionGateway.add: ", demandeImmersion);
    await sleep(SIMULATED_LATENCY_MS);
    this._demandesImmersion[demandeImmersion.id] = demandeImmersion;
    return demandeImmersion.id;
  }

  public async get(id: DemandeImmersionId): Promise<DemandeImmersionDto> {
    console.log("InMemoryDemandeImmersionGateway.get: ", id);
    await sleep(SIMULATED_LATENCY_MS);
    if (!this.featureFlags.enableViewableApplications)
      throw new Error("404 Not found");
    return this._demandesImmersion[id];
  }

  public async getAll(): Promise<Array<DemandeImmersionDto>> {
    console.log("InMemoryFormulaireGateway.getAll");
    await sleep(SIMULATED_LATENCY_MS);
    if (!this.featureFlags.enableViewableApplications)
      throw new Error("404 Not found");
    return Object.values(this._demandesImmersion);
  }

  public async update(
    demandeImmersion: DemandeImmersionDto
  ): Promise<DemandeImmersionId> {
    console.log("InMemoryDemandeImmersionGateway.update: ", demandeImmersion);
    await sleep(SIMULATED_LATENCY_MS);
    if (!this.featureFlags.enableViewableApplications)
      throw new Error("404 Not found");
    this._demandesImmersion[demandeImmersion.id] = demandeImmersion;
    return demandeImmersion.id;
  }

  public async getSiretInfo(siret: string): Promise<Object> {
    console.log("InMemoryDemandeImmersionGateway.getSiretInfo: " + siret);
    await sleep(SIMULATED_LATENCY_MS);

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
