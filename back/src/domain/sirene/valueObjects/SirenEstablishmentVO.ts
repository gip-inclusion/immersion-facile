import {
  GetSiretRequestDto,
  GetSiretResponseDto,
  NafDto,
  propEq,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { NumberEmployeesRange } from "../../immersionOffer/entities/EstablishmentEntity";
import { GetSiretCall, SireneApiEstablishment } from "../ports/SirenGateway";

export class SirenEstablishmentVO {
  static async getFromApi(
    { siret, includeClosedEstablishments }: GetSiretRequestDto,
    callGetSiret: GetSiretCall,
  ): Promise<SirenEstablishmentVO> {
    const response = await callGetSiret(siret, includeClosedEstablishments);
    if (
      !response ||
      !response.etablissements ||
      response.etablissements.length < 1
    ) {
      throw new NotFoundError("Did not find siret : " + siret);
    }

    return new SirenEstablishmentVO(response.etablissements[0]);
  }

  constructor(public readonly props: SireneApiEstablishment) {}

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

export const convertSirenEtablissementToResponse = (
  sireneEstablishment: SirenEstablishmentVO,
): GetSiretResponseDto => ({
  siret: sireneEstablishment.siret,
  businessName: sireneEstablishment.businessName,
  businessAddress: sireneEstablishment.formatedAddress,
  naf: sireneEstablishment.nafAndNomenclature,
  isOpen: sireneEstablishment.isActive,
});

// prettier-ignore
// tefenCode is a French standard code for the number of employees in a company.
type TefenCode = -1 | 0 | 1 | 2 | 3 | 11 | 12 | 21 | 22 | 31 | 32 | 41 | 42 | 51 | 52 | 53;

const employeeRangeByTefenCode: Record<TefenCode, NumberEmployeesRange> = {
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
