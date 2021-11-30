import { AxiosInstance } from "axios";
import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
import {
  RomeAppellation,
  RomeGateway,
  RomeMetier,
} from "../../../domain/rome/ports/RomeGateway";
import {
  RomeCodeAppellationDto,
  RomeCodeMetierDto,
} from "../../../shared/rome";
import { createAxiosInstance, logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);
export class PoleEmploiRomeGateway implements RomeGateway {
  private readonly axiosInstance: AxiosInstance;
  private readonly scope: string;

  public constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    poleEmploiClientId: string,
  ) {
    this.axiosInstance = createAxiosInstance(logger, {
      baseURL: "https://api.emploi-store.fr/partenaire/rome/v1",
      headers: {
        Accept: "application/json",
      },
    });

    this.scope = [
      `application_${poleEmploiClientId}`,
      "api_romev1",
      "nomenclatureRome",
    ].join(" ");
  }

  public async appellationToCodeMetier(
    romeCodeAppellation: RomeCodeAppellationDto,
  ): Promise<RomeCodeMetierDto | undefined> {
    const accessToken = await this.accessTokenGateway.getAccessToken(
      this.scope,
    );
    try {
      const response = await this.axiosInstance.get(
        `/appellation/${romeCodeAppellation}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken.access_token}`,
          },
        },
      );
      return response.data.metier.code;
    } catch (error: any) {
      logAxiosError(
        logger,
        error,
        "Error when calling Rome API from Pole Emploi / appellation",
      );
    }
  }

  public async searchMetier(query: string): Promise<RomeMetier[]> {
    const accessToken = await this.accessTokenGateway.getAccessToken(
      this.scope,
    );

    try {
      const response = await this.axiosInstance.get("/metier", {
        headers: {
          Authorization: `Bearer ${accessToken.access_token}`,
        },
        params: {
          q: query,
        },
      });
      return response.data.map((metier: any) => ({
        codeMetier: metier.code,
        libelle: metier.libelle,
      }));
    } catch (error: any) {
      logAxiosError(
        logger,
        error,
        "Error when calling Rome API from Pole Emploi / SearchMetier",
      );
      return [];
    }
  }

  public async searchAppellation(query: string): Promise<RomeAppellation[]> {
    const accessToken = await this.accessTokenGateway.getAccessToken(
      this.scope,
    );

    try {
      const response = await this.axiosInstance.get("/appellation", {
        headers: {
          Authorization: `Bearer ${accessToken.access_token}`,
        },
        params: {
          q: query,
        },
      });

      return response.data.map((appellation: any) => ({
        codeAppellation: appellation.code,
        libelle: appellation.libelle,
      }));
    } catch (error: any) {
      logAxiosError(
        logger,
        error,
        "Error when calling Rome API from Pole Emploi / SearchAppelation",
      );
      return [];
    }
  }
}
