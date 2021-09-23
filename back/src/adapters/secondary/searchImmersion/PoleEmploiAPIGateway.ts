import axios from "axios";
import querystring from "querystring";
import { logger } from "../../../utils/logger";

export class PoleEmploiAPIGateway {
  private readonly logger = logger.child({ logsource: "PoleEmploiAPIGateway" });

  public async getAccessToken(scope: string) {
    let dataAcessToken = querystring.stringify({
      grant_type: "client_credentials",
      //process.env.CLIENT_ID_POLE_EMPLOI,
      client_id:
        "PAR_limmersionfacile_61f728ccbab3458cb64ffab4d5a86f44171253d4f3d0e78bf63e01cdd438d844",
      //process.env.CLIENT_SECRET_POLE_EMPLOI,
      client_secret:
        "ac43feeb1e61607d9111a328d3acfc70ea49d93c45f286d8d5286321cf2b90f7",
      scope: scope,
    });
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    return axios
      .post(
        "https://entreprise.pole-emploi.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
        dataAcessToken,
        { headers }
      )
      .then(function (response: any) {
        return response.data;
      })
      .catch(function (error: any) {
        logger.error(error);
        return [];
      });
  }
}
