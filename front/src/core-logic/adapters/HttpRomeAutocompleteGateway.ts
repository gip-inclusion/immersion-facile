import axios from "axios";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import {
  AppellationMatchDto,
  RomeDto,
} from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { appellationRoute, romeRoute } from "src/shared/routes";

const prefix = "api";

export class HttpRomeAutocompleteGateway implements RomeAutocompleteGateway {
  public async getRomeDtoMatching(searchText: string): Promise<RomeDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${romeRoute}`, {
      params: { searchText },
    });

    return httpResponse.data;
  }
  public async getAppellationDtoMatching(
    searchText: string,
  ): Promise<AppellationMatchDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${appellationRoute}`, {
      params: { searchText },
    });

    return httpResponse.data;
  }
}
