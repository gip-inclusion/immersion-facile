import { EstablishmentEntity, TefenCode } from "./EstablishmentEntity";
import type {
  MandatoryEstablishmentFields,
  EstablishmentFieldsToRetrieve,
  Position,
} from "./EstablishmentEntity";

export type GetPosition = (address: string) => Promise<Position>;

type ExtraEstablishmentInfos = { naf: string; numberEmployeesRange: TefenCode };
export type GetExtraEstablishmentInfos = (
  siret: string,
) => Promise<ExtraEstablishmentInfos>;

export type UncompleteEstablishmentProps = MandatoryEstablishmentFields &
  Partial<EstablishmentFieldsToRetrieve>;

export class UncompleteEstablishmentEntity {
  constructor(private props: UncompleteEstablishmentProps) {}

  getRomeCodesArray() {
    return this.props.romes;
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
    getExtraEstablishmentInfos: GetExtraEstablishmentInfos,
  ) {
    const extraEstablishmentInfo = await getExtraEstablishmentInfos(
      this.props.siret,
    );

    this.props.naf = extraEstablishmentInfo.naf;
    this.props.numberEmployeesRange = <TefenCode>(
      +extraEstablishmentInfo.numberEmployeesRange
    );
    return extraEstablishmentInfo;
  }

  public async searchForMissingFields(
    getPosition: GetPosition,
    getExtraEstablishmentInfos: GetExtraEstablishmentInfos,
  ): Promise<EstablishmentEntity> {
    let position: Position;
    if (!this.props.position) {
      position = await this.updatePosition(getPosition);
    } else {
      position = this.props.position;
    }

    let naf: string;
    let numberEmployeesRange: TefenCode;
    if (!this.props.naf || !this.props.numberEmployeesRange) {
      const otherProperties = await this.updateExtraEstablishmentInfos(
        getExtraEstablishmentInfos,
      );
      numberEmployeesRange = otherProperties.numberEmployeesRange;
      naf = otherProperties.naf;
    } else {
      naf = this.props.naf;
      numberEmployeesRange = this.props.numberEmployeesRange;
    }

    return new EstablishmentEntity({
      id: this.props.id,
      address: this.props.address,
      city: this.props.city,
      score: this.props.score,
      romes: this.props.romes,
      siret: this.props.siret,
      dataSource: this.props.dataSource,
      name: this.props.name,
      numberEmployeesRange: numberEmployeesRange,
      position: position,
      naf: naf,
    });
  }
}
