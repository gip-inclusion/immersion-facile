import { AppellationAndRomeDto, toLowerCaseWithoutDiacritics } from "shared";
import { AppellationsGateway } from "../ports/AppellationsGateway";
import { DiagorienteAccessTokenResponse } from "./DiagorienteAppellationsGateway";

export class InMemoryAppellationsGateway implements AppellationsGateway {
  public async searchAppellations(
    query: string,
  ): Promise<AppellationAndRomeDto[]> {
    return [
      {
        romeCode: "M1607",
        appellationCode: "19364",
        appellationLabel: "Secrétaire",
        romeLabel: "Secrétariat",
      },
      {
        romeCode: "M1607",
        appellationCode: "19367",
        appellationLabel: "Secrétaire bureautique spécialisé / spécialisée",
        romeLabel: "Secrétariat",
      },
      {
        appellationLabel: "Jardinier / Jardinière",
        appellationCode: "19368",
        romeCode: "A1203",
        romeLabel: "Entretien des espaces verts",
      },
    ].filter((appellation) =>
      toLowerCaseWithoutDiacritics(appellation.appellationLabel).includes(
        toLowerCaseWithoutDiacritics(query),
      ),
    );
  }
  public async getAccessToken(): Promise<DiagorienteAccessTokenResponse> {
    return {
      access_token: "fake-access-token",
      expires_in: 3600,
      token_type: "Bearer",
      "not-before-policy": 0,
      refresh_expires_in: 0,
      scope: "profile",
    };
  }
}
