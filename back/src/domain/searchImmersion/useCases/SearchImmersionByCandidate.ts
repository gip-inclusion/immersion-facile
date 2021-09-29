import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";
import type { SearchParams } from "../ports/SearchParams";
import { CompanyEntity } from "../entities/CompanyEntity";

import { v4 as uuidV4 } from "uuid";
import { CompaniesGateway } from "../ports/CompaniesGateway";

//A mettre dans ports

export class SearchImmersionByCandidate {
  constructor(private laBonneBoiteGateway: CompaniesGateway) {}

  public async execute(
    searchParams: SearchParams,
  ): Promise<ImmersionOfferEntity[]> {
    return this.getImmersionLaBonneBoite(searchParams);
  }

  //TODO : en faire une classe à part
  async getImmersionLaBonneBoite(searchParams: SearchParams) {
    const laBonneBoiteCompanies = await this.laBonneBoiteGateway.getCompanies(
      searchParams,
    );
    return laBonneBoiteCompanies.map((laBonneBoitecompany: CompanyEntity) =>
      this.transformCompanyInImmersion(laBonneBoitecompany),
    );
  }

  private transformCompanyInImmersion(
    company: CompanyEntity,
  ): ImmersionOfferEntity {
    return new ImmersionOfferEntity(
      uuidV4(),
      company.getName(),
      company.getNaf(),
      company.getMatched_rome_code(),
      company.getSiret(),
    );
  }
}
