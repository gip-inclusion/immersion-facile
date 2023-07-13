import { OpenAPIV3 } from "openapi-types";
import { Observable } from "rxjs";

export interface OpenApiDocGateway {
  getOpenApiDoc$(): Observable<OpenAPIV3.Document>;
}
