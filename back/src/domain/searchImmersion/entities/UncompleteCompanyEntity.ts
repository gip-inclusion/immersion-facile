import { CompanyEntity, TefenCode } from "./CompanyEntity";
import type {
  MandatoryCompanyFields,
  CompanyFieldsToRetrieve,
  Position,
} from "./CompanyEntity";

export type GetPosition = (address: string) => Promise<Position>;

type ExtraCompanyInfos = { naf: string; numberEmployeesRange: TefenCode };
export type GetExtraCompanyInfos = (
  siret: string,
) => Promise<ExtraCompanyInfos>;

export type UncompleteCompanyProps = MandatoryCompanyFields &
  Partial<CompanyFieldsToRetrieve>;

export class UncompleteCompanyEntity {
  constructor(private props: UncompleteCompanyProps) {}

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

  public async updateExtraCompanyInfos(
    getExtraCompanyInfos: GetExtraCompanyInfos,
  ) {
    const extraCompanyInfo = await getExtraCompanyInfos(this.props.siret);

    this.props.naf = extraCompanyInfo.naf;
    this.props.numberEmployeesRange = <TefenCode>(
      +extraCompanyInfo.numberEmployeesRange
    );
    return extraCompanyInfo;
  }

  public async searchForMissingFields(
    getPosition: GetPosition,
    getExtraCompanyInfos: GetExtraCompanyInfos,
  ): Promise<CompanyEntity> {
    let position: Position;
    if (!this.props.position) {
      position = await this.updatePosition(getPosition);
    } else {
      position = this.props.position;
    }

    let naf: string;
    let numberEmployeesRange: TefenCode;
    if (!this.props.naf || !this.props.numberEmployeesRange) {
      const otherProperties = await this.updateExtraCompanyInfos(
        getExtraCompanyInfos,
      );
      numberEmployeesRange = otherProperties.numberEmployeesRange;
      naf = otherProperties.naf;
    } else {
      naf = this.props.naf;
      numberEmployeesRange = this.props.numberEmployeesRange;
    }

    return new CompanyEntity({
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
