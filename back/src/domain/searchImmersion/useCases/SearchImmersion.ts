import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";
import type { SearchParams } from "../ports/SearchParams";
import { CompanyEntity } from "../entities/CompanyEntity";

import { v4 as uuidV4 } from "uuid";
import { LaBonneBoiteGateway } from "../../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import { CompaniesGateway } from "../ports/CompaniesGateway";
import { UncompleteCompanyEntity } from "../entities/UncompleteCompanyEntity";

//A mettre dans ports

export class SearchImmersion {
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

    const immersionOffers = laBonneBoiteCompanies.flatMap(
      (laBonneBoitecompany) =>
        this.extractImmersionsFromCompany(laBonneBoitecompany),
    );

    return immersionOffers;
  }

  private extractImmersionsFromCompany(
    company: UncompleteCompanyEntity,
  ): ImmersionOfferEntity[] {
    const romeArray = company.getRomeCodesArray();
    return romeArray.map(
      (rome) =>
        new ImmersionOfferEntity(
          uuidV4(),
          rome,
          company.getSiret(),
          company.getName(),
          company.getDataSource(),
          company.getScore(),
        ),
    );
  }
}
