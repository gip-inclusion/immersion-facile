import { type Observable, from } from "rxjs";
import type { NafRoutes, NafSectionSuggestion } from "shared";
import type { HttpClient } from "shared-routes";
import {
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import type { NafGateway } from "src/core-logic/ports/NafGateway";
import { match } from "ts-pattern";

export class HttpNafGateway implements NafGateway {
  constructor(private readonly httpClient: HttpClient<NafRoutes>) {}

  getNafSuggestions$(searchText: string): Observable<NafSectionSuggestion[]> {
    return from(
      this.httpClient
        .nafSectionSuggestions({
          queryParams: {
            searchText,
          },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
