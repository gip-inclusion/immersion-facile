import axios from "axios";
import { ContactEstablishmentRequestDto } from "../../shared/contactEstablishment";
import {
  contactEstablishmentRoute,
  searchImmersionRoute,
} from "../../shared/routes";
import {
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
} from "../../shared/SearchImmersionDto";
import { ImmersionSearchGateway } from "../ports/ImmersionSearchGateway";

const prefix = "api";

export class HttpImmersionSearchGateway implements ImmersionSearchGateway {
  public async search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResultDto[]> {
    const response = await axios.post(
      `/${prefix}/${searchImmersionRoute}`,
      searchParams,
    );

    return response.data;
  }

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    const response = await axios.post(
      `/${prefix}/${contactEstablishmentRoute}`,
      params,
    );
    console.log(
      "Contact establishments response status",
      response?.data?.status,
    );
  }
}
