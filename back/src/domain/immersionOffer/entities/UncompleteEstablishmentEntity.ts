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
import { Establishment } from "../../../../../front/src/core-logic/ports/EstablishmentInfoFromSiretApi";

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
    if (extraEstablishmentInfo) {
      this.props.naf =
        extraEstablishmentInfo.etablissements[0].uniteLegale.activitePrincipaleUniteLegale!;
      if (
        extraEstablishmentInfo.etablissements[0].uniteLegale
          .trancheEffectifsUniteLegale
      )
        this.props.numberEmployeesRange = <TefenCode>(
          +extraEstablishmentInfo.etablissements[0].uniteLegale
            .trancheEffectifsUniteLegale
        );
      return extraEstablishmentInfo;
    }
  }

  public async searchForMissingFields(
    getPosition: GetPosition,
    sirenRepositiory: SireneRepository,
  ): Promise<EstablishmentEntity | undefined> {
    let position: Position;
    if (!this.props.position) {
      position = await this.updatePosition(getPosition);
    } else {
      position = this.props.position;
    }

    let naf: string;
    let numberEmployeesRange: TefenCode;
    if (!this.props.naf || !this.props.numberEmployeesRange) {
      await this.updateExtraEstablishmentInfos(sirenRepositiory);

      if (this.props.naf && this.props.numberEmployeesRange) {
        const establishmentToReturn = new EstablishmentEntity({
          id: this.props.id,
          address: this.props.address,
          score: this.props.score,
          romes: this.props.romes,
          voluntary_to_immersion: this.props.voluntary_to_immersion,
          siret: this.props.siret,
          dataSource: this.props.dataSource,
          name: this.props.name,
          numberEmployeesRange: this.props.numberEmployeesRange,
          position: position,
          naf: this.props.naf,
        });
        if (this.props.contact_mode) {
          establishmentToReturn.setContact_mode(this.props.contact_mode);
        }
        if (this.props.contact_in_establishment) {
          establishmentToReturn.setContact_in_establishment(
            this.props.contact_in_establishment,
          );
        }
        return establishmentToReturn;
      } else {
        return undefined;
      }
    }
  }
}
