import Airtable, { FieldSet, Table } from "airtable";
import { DemandeImmersionEntity } from "../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../../domain/demandeImmersion/ports/DemandeImmersionRepository";
import { DemandeImmersionId } from "../../shared/DemandeImmersionDto";
import { FeatureDisabledError } from "../../shared/featureFlags";
import {
  convertToFrenchNamedDays,
  prettyPrintSchedule,
} from "../../shared/ScheduleUtils";
import { logger } from "../../utils/logger";

export class AirtableOriginalBetaDemandeImmersionRepository
  implements DemandeImmersionRepository
{
  private readonly logger = logger.child({
    logsource: "AirtableOriginalBetaDemandeImmersionRepository",
  });
  private readonly table: Table<FieldSet>;

  constructor(table: Table<FieldSet>) {
    this.table = table;
  }

  public static create(apiKey: string, baseId: string, tableName: string) {
    return new AirtableOriginalBetaDemandeImmersionRepository(
      new Airtable({ apiKey }).base(baseId)(tableName)
    );
  }

  public async save(
    entity: DemandeImmersionEntity
  ): Promise<DemandeImmersionId | undefined> {
    try {
      const response = await this.table.create([
        {
          fields: convertEntityToFieldSet(entity),
        },
      ]);
      if (response.length < 1) {
        throw new Error("Unexpected response length.");
      }
      return entity.id;
    } catch (e: any) {
      this.logger.error(e, `Error creating Airtable record: ${entity.id}`);
      throw e;
    }
  }

  public async getById(
    id: DemandeImmersionId
  ): Promise<DemandeImmersionEntity | undefined> {
    throw new FeatureDisabledError();
  }

  public async getAll(): Promise<DemandeImmersionEntity[]> {
    throw new FeatureDisabledError();
  }

  public async updateDemandeImmersion(
    demandeImmersion: DemandeImmersionEntity
  ): Promise<DemandeImmersionId | undefined> {
    throw new FeatureDisabledError();
  }
}

const convertEntityToFieldSet = (entity: DemandeImmersionEntity): FieldSet => {
  const convertBooleanToOuiNon = (b: boolean) => (b ? "oui" : "non");
  const dto = entity.toDto();

  return {
    Nom: dto.lastName,
    Prénom: dto.firstName,
    Courriel: dto.email,
    "Portable (tel. 1 ou 2)": dto.phone || "",
    "N° de SIRET de l'organisme d'accueil (entreprise, association, service public ...)":
      parseInt(dto.siret),
    "Objectif PMSMP": dto.immersionObjective || undefined,
    "Indiquez le prénom, nom et fonction du tuteur :": dto.mentor,
    "Tel tuteur": dto.mentorPhone,
    "mail tuteur": dto.mentorEmail,
    "Date de début de l'immersion :": dto.dateStart,
    "Date de fin de l'immersion :": dto.dateEnd,
    "Journées pendant lesquelles l'immersion va se dérouler":
      convertToFrenchNamedDays(dto.schedule),
    "Indiquez les horaires de l'immersion :": prettyPrintSchedule(dto.schedule),
    "Un équipement de protection individuelle est-il fourni pour l’immersion ?":
      convertBooleanToOuiNon(dto.individualProtection),
    "D’autres mesures de prévention sont-elles prévues pour l’immersion ?":
      convertBooleanToOuiNon(dto.sanitaryPrevention),
    "Si oui, précisez-les  :": dto.sanitaryPreventionDescription || "",
    "Intitulé du poste/métier observé pendant l'immersion :":
      dto.immersionProfession,
    "Activités observées/pratiquées : (ex : mise en rayon, accueil et aide à la clientèle)":
      dto.immersionActivities,
    "Compétences observées/évaluées : (ex: communiquer à l'oral, résoudre des problèmes, travailler en équipe)":
      dto.immersionSkills || "",
    "Obligations des parties (bénéficiaire)": convertBooleanToOuiNon(
      dto.beneficiaryAccepted
    ),
    "Adresse du lieu où se fera l'immersion (Lieu d’exécution (si différent de l’adresse de la structure d’accueil)":
      dto.immersionAddress || "",
    "Indiquez le nom (raison sociale) de l'établissement d'accueil":
      dto.businessName,
    "Obligations des parties (structure d'accueil)": convertBooleanToOuiNon(
      dto.enterpriseAccepted
    ),
  };
};
