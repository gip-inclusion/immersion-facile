import { OpenAPIV3 } from "openapi-types";
import { Observable, Subject } from "rxjs";
import { OpenApiDocGateway } from "src/core-logic/ports/OpenApiDocGateway";

export class InMemoryOpenApiDocGateway implements OpenApiDocGateway {
  public openApiDoc$ = new Subject<OpenAPIV3.Document>();

  public getOpenApiDoc$(): Observable<OpenAPIV3.Document> {
    return this.openApiDoc$;
  }
}
