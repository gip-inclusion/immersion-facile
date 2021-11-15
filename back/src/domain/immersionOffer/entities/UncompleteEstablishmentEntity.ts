import {
  EstablishmentEntity,
  TefenCode,
  OptionalEstablishmentFields,
} from "./EstablishmentEntity";
import type {
  MandatoryEstablishmentFields,
  EstablishmentFieldsToRetrieve,
  Position,
} from "./EstablishmentEntity";
import {
  SireneRepository,
  SireneRepositoryAnswer,
} from "../../sirene/ports/SireneRepository";

export type GetPosition = (address: string) => Promise<Position>;

export type ExtraEstablishmentInfos = {
  naf: string;
  numberEmployeesRange: TefenCode;
};
export type GetExtraEstablishmentInfos = (
  siret: string,
) => Promise<ExtraEstablishmentInfos>;

export type UncompleteEstablishmentProps = MandatoryEstablishmentFields &
  Partial<EstablishmentFieldsToRetrieve> &
  Partial<OptionalEstablishmentFields>;

export class UncompleteEstablishmentEntity {
  constructor(private props: UncompleteEstablishmentProps) {}

  getRomeCodesArray() {
    return this.props.romes;
  }

  getPosition() {
    return this.props.position;
  }

  public getSiret() {
    return this.props.siret;
  }

  public getNaf() {
    return this.props.naf;
  }
  public getName() {
    return this.props.name;
  }

  public getDataSource() {
    return this.props.dataSource;
  }
  public getScore() {
    return this.props.score;
  }

  public async updatePosition(getPosition: GetPosition): Promise<Position> {
    const position = await getPosition(this.props.address);
    this.props.position = position;
    return position;
  }

  public async updateExtraEstablishmentInfos(
    sirenRepositiory: SireneRepository,
  ): Promise<SireneRepositoryAnswer | undefined> {
    const extraEstablishmentInfo = await sirenRepositiory.get(this.props.siret);
    if (!extraEstablishmentInfo) return;

    this.props.naf =
      extraEstablishmentInfo.etablissements[0].uniteLegale.activitePrincipaleUniteLegale?.replace(
        ".",
        "",
      );

    const trancheEffectifsUniteLegale =
      extraEstablishmentInfo.etablissements[0].uniteLegale
        .trancheEffectifsUniteLegale;

    if (trancheEffectifsUniteLegale)
      this.props.numberEmployeesRange = <TefenCode>+trancheEffectifsUniteLegale;

    return extraEstablishmentInfo;
  }

  public async searchForMissingFields(
    getPosition: GetPosition,
    sireneRepository: SireneRepository,
  ): Promise<EstablishmentEntity | undefined> {
    const position: Position =
      this.props.position ?? (await this.updatePosition(getPosition));

    if (!this.props.naf || !this.props.numberEmployeesRange) {
      await this.updateExtraEstablishmentInfos(sireneRepository);

      if (this.props.naf && this.props.numberEmployeesRange) {
        const establishmentToReturn = new EstablishmentEntity({
          id: this.props.id,
          address: this.props.address,
          score: this.props.score,
          romes: this.props.romes,
          voluntaryToImmersion: this.props.voluntaryToImmersion,
          siret: this.props.siret,
          dataSource: this.props.dataSource,
          name: this.props.name,
          numberEmployeesRange: this.props.numberEmployeesRange,
          position: position,
          naf: this.props.naf,
        });

        if (this.props.contactMode) {
          establishmentToReturn.setContactMode(this.props.contactMode);
        }
        if (this.props.contactInEstablishment) {
          establishmentToReturn.setContactInEstablishment(
            this.props.contactInEstablishment,
          );
        }
        return establishmentToReturn;
      } else {
        return undefined;
      }
    }
  }
}
