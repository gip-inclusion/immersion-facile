import { CompaniesGateway } from "../../../domain/searchImmersion/ports/CompaniesGateway";
import { SearchParams } from "../../../domain/searchImmersion/ports/SearchParams";
import { CompanyEntity } from "../../../domain/searchImmersion/entities/CompanyEntity";
import axios from "axios";
import { logger } from "../../../utils/logger";
import { v4 as uuidV4 } from "uuid";
import { string } from "yup/lib/locale";
import { fakeCompaniesLaPlateFormeDeLInclusion } from "./fakeCompaniesLaPlateFormeDeLInclusion";
import { UncompleteCompanyEntity } from "../../../domain/searchImmersion/entities/UncompleteCompanyEntity";
import {
  convertLaPlateFormeDeLInclusionToUncompletCompany,
  CompanyFromLaPlateFormeDeLInclusion,
} from "./LaPlateFormeDeLInclusionGateway";

export class FakeLaPlateFormeDeLInclusionGateway implements CompaniesGateway {
  private readonly logger = logger.child({
    logsource: "LaPlateFormeDeLInclusionGateway",
  });

  async getCompanies(
    searchParams: SearchParams,
  ): Promise<UncompleteCompanyEntity[]> {
    const companies: CompanyFromLaPlateFormeDeLInclusion[] =
      fakeCompaniesLaPlateFormeDeLInclusion;
    return fakeCompaniesLaPlateFormeDeLInclusion.map(
      convertLaPlateFormeDeLInclusionToUncompletCompany,
    );
  }
}
