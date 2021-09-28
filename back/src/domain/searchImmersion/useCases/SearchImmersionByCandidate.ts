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
    var companies = laBonneBoiteCompanies.map(
      (laBonneBoitecompany: CompanyEntity) =>
        this.transformCompanyInImmersions(laBonneBoitecompany),
    );

    //A trick to make flatmap in nodejs
    var emptyArray: ImmersionOfferEntity[] = [];
    return emptyArray.concat.apply([], companies);
  }

  private transformCompanyInImmersions(
    company: CompanyEntity,
  ): ImmersionOfferEntity[] {
    const immersionOffers: ImmersionOfferEntity[] = [];
    const romeArray = company.getRomeCodesArray();
    for (const romeIndex in romeArray) {
      immersionOffers.push(
        new ImmersionOfferEntity(
          uuidV4(),
          romeArray[romeIndex],
          company.getNaf(),
          company.getSiret(),
          company.getName(),
        ),
      );
    }
    return immersionOffers;
  }
}
