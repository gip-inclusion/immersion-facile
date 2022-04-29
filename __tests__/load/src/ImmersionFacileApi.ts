import http from "k6/http";
import type { SearchImmersionRequestDto } from "./src/SearchImmersionDto";

export class ImmersionFacileApi {
  private readonly urlPrefix: string;

  public constructor(testHost: string) {
    this.urlPrefix = `http://${testHost}/api`;
  }

  public searchImmersion(request: SearchImmersionRequestDto) {
    return http.post(
      `${this.urlPrefix}/search-immersion`,
      JSON.stringify(request),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
