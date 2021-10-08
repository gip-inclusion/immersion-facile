import axios from "axios";
import { Position } from "../../../domain/searchImmersion/entities/CompanyEntity";

export class APIAdresseGateway {
  async getGPSFromAddressAPIAdresse(address: string): Promise<Position> {
    return axios
      .get("https://api-adresse.data.gouv.fr/search/", {
        params: {
          q: address,
        },
      })
      .then((response: any) => {
        return {
          lat: response.data.features[0].geometry.coordinates[0],
          lon: response.data.features[0].geometry.coordinates[0],
        };
      })
      .catch(function (error: any) {
        return { lat: -1, lon: -1 };
      });
  }
  /*
        Returns city code from latitude and longitude parameters using the api-adresse API from data.gouv
        Returns -1 if did not find
        */
  async getCityCodeFromLatLongAPIAdresse(
    lat: number,
    lon: number,
  ): Promise<number> {
    return axios
      .get("https://api-adresse.data.gouv.fr/reverse/", {
        params: {
          lon: lon,
          lat: lat,
        },
      })
      .then((response: any) => {
        if (response.data.features.length != 0)
          return response.data.features[0].properties.citycode;
        else return -1;
      })
      .catch(function (error: any) {
        return -1;
      });
  }
}
