import { OpenAPIV3 } from "openapi-types";
import { from, Observable } from "rxjs";
import { OpenApiDocTargets } from "shared";
import { HttpClient } from "http-client";
import { OpenApiDocGateway } from "src/core-logic/ports/OpenApiDocGateway";

export class HttpOpenApiDocGateway implements OpenApiDocGateway {
  constructor(private readonly httpClient: HttpClient<OpenApiDocTargets>) {}

  public getOpenApiDoc$(): Observable<OpenAPIV3.Document> {
    return from(
      this.httpClient.getOpenApiDoc().then(({ responseBody }) => responseBody),
    );
  }
}
