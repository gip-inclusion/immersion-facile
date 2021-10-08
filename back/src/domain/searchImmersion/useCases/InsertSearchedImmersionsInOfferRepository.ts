import { PgImmersionOfferRepository } from "../../../adapters/secondary/searchImmersion/PgImmersionOfferRepository";
import { SearchParams } from "../ports/ImmersionOfferRepository";
import { LaBonneBoiteGateway } from "../../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import { LaPlateFormeDeLInclusionGateway } from "../../../adapters/secondary/searchImmersion/LaPlateFormeDeLInclusionGateway";
import { APIAdresseGateway } from "../../../adapters/secondary/searchImmersion/APIAdresseGateway";
import { CompaniesGateway } from "../ports/CompaniesGateway";
import {
  GetPosition,
  GetExtraCompanyInfos,
} from "../entities/UncompleteCompanyEntity";
import { CompanyEntity } from "../entities/CompanyEntity";
import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";
import { v4 as uuidV4 } from "uuid";

export class InsertSearchedImmersionsInOfferRepository {
  constructor(
    private laBonneBoiteGateway: CompaniesGateway,
    private laPlateFormeDeLinclusionGateway: CompaniesGateway,
    private getPosition: GetPosition,
    private getExtraCompanyInfos: GetExtraCompanyInfos,
    private pgImmersionOfferRepository: PgImmersionOfferRepository,
  ) {}

  public async execute(searchParams: SearchParams) {
    this.pgImmersionOfferRepository.connect();

    //We first take all searches made in the past
    const searchesMade =
      await this.pgImmersionOfferRepository.getSearchesMadeAndNotInserted();

    //For all these searches, we go to check if we have potential immersions in our available databases
    for (const searchMade in searchesMade) {
      const companiesLaPlateFormeDeLinclusion =
        await this.laPlateFormeDeLinclusionGateway.getCompanies(
          searchesMade[searchMade],
        );
      const companiesLaBonneBoite = await this.laBonneBoiteGateway.getCompanies(
        searchesMade[searchMade],
      );
      const allCompanies: CompanyEntity[] = await Promise.all(
        companiesLaPlateFormeDeLinclusion
          .concat(companiesLaBonneBoite)
          .map(
            async (uncompleteCompanyEntity) =>
              await uncompleteCompanyEntity.searchForMissingFields(
                this.getPosition,
                this.getExtraCompanyInfos,
              ),
          ),
      );

      //We then transform  dfffdthem into immersions and add them to our database
      const allImmersions = allCompanies.flatMap((company) =>
        this.extractImmersionsFromCompany(company),
      );
      this.pgImmersionOfferRepository.insertImmersions(allImmersions);
    }
  }

  private extractImmersionsFromCompany(
    company: CompanyEntity,
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
