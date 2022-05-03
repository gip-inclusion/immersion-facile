import axios from "axios";
import { siretRoute } from "src/shared/routes";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { SiretGatewayThroughBack } from "../ports/SiretGatewayThroughBack";
const prefix = "api";

export class HttpSiretGatewayThroughBack implements SiretGatewayThroughBack {
  public async getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto> {
    const httpResponse = await axios.get(`/${prefix}/${siretRoute}/${siret}`);
    return httpResponse.data;
  }
}
