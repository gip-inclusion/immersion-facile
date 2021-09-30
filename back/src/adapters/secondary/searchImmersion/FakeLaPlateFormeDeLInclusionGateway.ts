import { CompaniesGateway } from "../../../domain/searchImmersion/ports/CompaniesGateway";
import { SearchParams } from "../../../domain/searchImmersion/ports/SearchParams";
import { fakeCompaniesLaPlateFormeDeLInclusion } from "./fakeCompaniesLaPlateFormeDeLInclusion";
import { UncompleteCompanyEntity } from "../../../domain/searchImmersion/entities/UncompleteCompanyEntity";
import {
  convertLaPlateFormeDeLInclusionToUncompletCompany,
  CompanyFromLaPlateFormeDeLInclusion,
} from "./LaPlateFormeDeLInclusionGateway";

export class FakeLaPlateFormeDeLInclusionGateway implements CompaniesGateway {
  async getCompanies(
    searchParams: SearchParams,
  ): Promise<UncompleteCompanyEntity[]> {
    return fakeCompaniesLaPlateFormeDeLInclusion.map(
      convertLaPlateFormeDeLInclusionToUncompletCompany,
    );
  }
}
