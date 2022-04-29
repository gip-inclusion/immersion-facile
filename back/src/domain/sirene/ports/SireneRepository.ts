import { NafDto } from "shared/src/naf";
import { propEq } from "shared/src/ramdaExtensions/propEq";
import { SiretDto } from "shared/src/siret";
import {
  TooManyRequestApiError,
  UnavailableApiError,
} from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { NumberEmployeesRange } from "../../immersionOffer/entities/EstablishmentEntity";

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
  periodesEtablissement: Array<
    Partial<{
      dateFin: string | null;
      dateDebut: string | null;
      etatAdministratifEtablissement: "A" | "F";
    }>
  >;
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
  public get numberEmployeesRange(): NumberEmployeesRange {
    const tefenCode = this.uniteLegale.trancheEffectifsUniteLegale;

    if (!tefenCode || tefenCode === "NN") return "";
    return employeeRangeByTefenCode[<TefenCode>+tefenCode];
  }
  public get isActive(): boolean {
    const lastPeriod = this.props.periodesEtablissement.find(
      propEq("dateFin", null),
    );
    if (!lastPeriod) return false;
    // The etatAdministratifUniteLegale is "C" for closed establishments, "A" for active ones.
    return (
      this.uniteLegale.etatAdministratifUniteLegale === "A" &&
      lastPeriod.etatAdministratifEtablissement === "A"
    );
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
      const serviceName = "Sirene API";
      logger.error({ siret, error }, "Error fetching siret");
      if (error.initialError.status === 429)
        throw new TooManyRequestApiError(serviceName);
      throw new UnavailableApiError(serviceName);
    });
  }

  abstract _get(
    siret: SiretDto,
    includeClosedEstablishments?: boolean,
  ): Promise<SireneRepositoryAnswer | undefined>;
}

// prettier-ignore
export type TefenCode = -1 | 0 | 1 | 2 | 3 | 11 | 12 | 21 | 22 | 31 | 32 | 41 | 42 | 51 | 52 | 53;

export const employeeRangeByTefenCode: Record<TefenCode, NumberEmployeesRange> =
  {
    [-1]: "",
    [0]: "0",
    [1]: "1-2",
    [2]: "3-5",
    [3]: "6-9",
    [11]: "10-19",
    [12]: "20-49",
    [21]: "50-99",
    [22]: "100-199",
    [31]: "200-249",
    [32]: "250-499",
    [41]: "500-999",
    [42]: "1000-1999",
    [51]: "2000-4999",
    [52]: "5000-9999",
    [53]: "+10000",
  };
