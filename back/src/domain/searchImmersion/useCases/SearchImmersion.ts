import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";
import { CompanyEntity } from "../entities/CompanyEntity";

import { v4 as uuidV4 } from "uuid";
import { LaBonneBoiteGateway } from "../../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import { CompaniesGateway } from "../ports/CompaniesGateway";
import { UncompleteCompanyEntity } from "../entities/UncompleteCompanyEntity";
import type {
  ImmersionOfferRepository,
  SearchParams,
} from "../ports/ImmersionOfferRepository";

//A mettre dans ports

export class SearchImmersion {
  constructor(
    private laBonneBoiteGateway: CompaniesGateway,
    private immersionOfferRepository: ImmersionOfferRepository,
  ) {}

  public async execute(
    searchParams: SearchParams,
  ): Promise<ImmersionOfferEntity[]> {
    this.immersionOfferRepository.insertSearch(searchParams);
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
  /*
export type ImmersionOfferProps = {
  id: ImmersionOfferId;
  rome: string;
  naf?: string;
  siret: string;
  name: string;
  voluntary_to_immersion: boolean;
  data_source: string;
  contact_in_company_uuid?: ImmersionCompanyContact;
  score: number;
};
*/
  private extractImmersionsFromCompany(
    company: UncompleteCompanyEntity,
  ): ImmersionOfferEntity[] {
    const romeArray = company.getRomeCodesArray();
    return romeArray.map(
      (rome) =>
        new ImmersionOfferEntity({
          id: uuidV4(),
          rome: rome,
          naf: company.getNaf(),
          siret: company.getSiret(),
          name: company.getName(),
          voluntary_to_immersion: false,
          data_source: company.getDataSource(),
          contact_in_company: undefined,
          score: company.getScore(),
        }),
    );
  }
}
