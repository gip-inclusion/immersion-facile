import axios, { AxiosInstance } from "axios";
import { siretRoute } from "src/shared/routes";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { SiretGatewayThroughBack } from "../ports/SiretGatewayThroughBack";
const prefix = "api";

export class HttpSiretGatewayThroughBack implements SiretGatewayThroughBack {
  private axiosInstance: AxiosInstance;

  constructor(baseURL = `/${prefix}`) {
    this.axiosInstance = axios.create({
      baseURL,
    });
  }

  public async getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto> {
    const httpResponse = await this.axiosInstance.get(
      `/${siretRoute}/${siret}`,
    );
    return httpResponse.data;
  }
}
