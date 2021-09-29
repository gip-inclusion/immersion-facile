import { CompanyEntity } from "./CompanyEntity";
import type {
  MandatoryCompanyFields,
  CompanyFieldsToRetrieve,
  Position,
} from "./CompanyEntity";

type GetPosition = (address: string) => Promise<Position>;
type GetNaf = (siret: string) => Promise<string>;

export type UncompleteCompanyProps = MandatoryCompanyFields &
  Partial<CompanyFieldsToRetrieve>;

export class UncompleteCompanyEntity {
  constructor(private props: UncompleteCompanyProps) {}

  public async updatePosition(getPosition: GetPosition) {
    const position = await getPosition(this.props.address);
    this.props.position = position;
  }

  public async updateNaf(getNaf: GetNaf) {
    const naf = await getNaf(this.props.address);
    this.props.naf = naf;
  }

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
}
