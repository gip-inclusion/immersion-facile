import axios, { AxiosInstance } from "axios";
import {
  RomeAppellation,
  RomeGateway,
  RomeMetier,
} from "../../domain/rome/ports/RomeGateway";
import { createLogger } from "../../utils/logger";
import { AccessTokenGateway } from "./../../domain/core/ports/AccessTokenGateway";

const logger = createLogger(__filename);
export class PoleEmploiRomeGateway implements RomeGateway {
  private readonly axiosInstance: AxiosInstance;
  private readonly scope: string;

  public constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    poleEmploiClientId: string,
  ) {
    this.axiosInstance = axios.create({
      baseURL: "https://api.emploi-store.fr/partenaire/rome/v1",
      headers: {
        Accept: "application/json",
      },
    });
    this.axiosInstance.interceptors.request.use((request) => {
      logger.info(request);
      return request;
    });
    this.axiosInstance.interceptors.response.use((response) => {
      logger.debug({
        status: response.status,
        headers: response.headers,
        data: response.data,
      });
      return response;
    });

    this.scope = [
      `application_${poleEmploiClientId}`,
      "api_romev1",
      "nomenclatureRome",
    ].join(" ");
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
      logger.warn(
        `Status was ${error.response.status} when calling Rome API from Pole Emploi / SearchMetier`,
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
      logger.warn(
        `Status was ${error.response.status} when calling Rome API from Pole Emploi / SearchAppelation`,
      );
      return [];
    }
  }
}
