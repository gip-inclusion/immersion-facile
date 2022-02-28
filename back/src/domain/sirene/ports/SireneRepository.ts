import { UnavailableApiError } from "../../../adapters/primary/helpers/httpErrors";
import { NafDto } from "../../../shared/naf";
import { SiretDto } from "../../../shared/siret";
import { createLogger } from "../../../utils/logger";
import { TefenCode } from "../../immersionOffer/entities/EstablishmentEntity";

const logger = createLogger(__filename);

export type SireneEstablishmentProps = {
  siret: string;
  uniteLegale: Partial<{
    denominationUniteLegale?: string;
    nomUniteLegale?: string;
    prenomUsuelUniteLegale?: string;
    activitePrincipaleUniteLegale?: string;
    nomenclatureActivitePrincipaleUniteLegale?: string;
    trancheEffectifsUniteLegale?: string;
    etatAdministratifUniteLegale?: string;
  }>;
  adresseEtablissement: Partial<{
    numeroVoieEtablissement?: string;
    typeVoieEtablissement?: string;
    libelleVoieEtablissement?: string;
    codePostalEtablissement?: string;
    libelleCommuneEtablissement?: string;
  }>;
};

export class SireneEstablishmentVO {
  constructor(public readonly props: SireneEstablishmentProps) {}

  public get siret() {
    return this.props.siret;
  }
  public get uniteLegale() {
    return this.props.uniteLegale;
  }

  public get businessName(): string {
    const denomination = this.uniteLegale.denominationUniteLegale;
    if (denomination) return denomination;

    return [
      this.uniteLegale.prenomUsuelUniteLegale,
      this.uniteLegale.nomUniteLegale,
    ]
      .filter((el) => !!el)
      .join(" ");
  }

  public get formatedAddress(): string {
    return [
      this.props.adresseEtablissement.numeroVoieEtablissement,
      this.props.adresseEtablissement.typeVoieEtablissement,
      this.props.adresseEtablissement.libelleVoieEtablissement,
      this.props.adresseEtablissement.codePostalEtablissement,
      this.props.adresseEtablissement.libelleCommuneEtablissement,
    ]
      .filter((el) => !!el)
      .join(" ");
  }
  public get naf(): string | undefined {
    return this.props.uniteLegale.activitePrincipaleUniteLegale?.replace(
      ".",
      "",
    );
  }
  public get nafAndNomenclature(): NafDto | undefined {
    if (
      !this.naf ||
      !this.uniteLegale.nomenclatureActivitePrincipaleUniteLegale
    )
      return undefined;

    return {
      code: this.naf,
      nomenclature: this.uniteLegale.nomenclatureActivitePrincipaleUniteLegale,
    };
  }
  public get numberEmployeesRange(): TefenCode {
    const tefenCode = this.uniteLegale.trancheEffectifsUniteLegale;
    return !tefenCode || tefenCode == "NN" ? -1 : <TefenCode>+tefenCode;
  }
  public get isActive(): boolean {
    // The etatAdministratifUniteLegale is "C" for closed establishments, "A" for active ones.
    return this.uniteLegale.etatAdministratifUniteLegale === "A";
  }
}

export type SireneRepositoryAnswer = {
  header: {
    statut: number;
    message: string;
    total: number;
    debut: number;
    nombre: number;
  };
  etablissements: SireneEstablishmentProps[];
};

export abstract class SireneRepository {
  public get(
    siret: SiretDto,
    includeClosedEstablishments?: boolean,
  ): Promise<SireneRepositoryAnswer | undefined> {
    return this._get(siret, includeClosedEstablishments).catch((error) => {
      logger.error({ siret, error }, "Error fetching siret");
      throw new UnavailableApiError("Sirene API");
    });
  }

  abstract _get(
    siret: SiretDto,
    includeClosedEstablishments?: boolean,
  ): Promise<SireneRepositoryAnswer | undefined>;
}
