import { Observable } from "rxjs";
import {
  AdminToken,
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  Role,
  ShareLinkByEmailDto,
  UpdateConventionStatusRequestDto,
} from "shared";

export interface ConventionGateway {
  retrieveFromToken$(jwt: string): Observable<ConventionReadDto | undefined>;
  add$(conventionDto: ConventionDto): Observable<void>;

  // Get an immersion application through backoffice, password-protected route.
  getById(id: ConventionId): Promise<ConventionReadDto>;

  update$(conventionDto: ConventionDto, jwt: string): Observable<void>;

  updateStatus$(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Observable<void>;

  signConvention$(jwt: string): Observable<void>;

  generateMagicLink(
    adminToken: AdminToken,
    applicationId: ConventionId,
    role: Role,
    expired: boolean,
  ): Promise<string>;

  renewMagicLink(expiredJwt: string, linkFormat: string): Promise<void>;

  // shareLinkByEmailDTO
  shareLinkByEmail(shareLinkByEmailDTO: ShareLinkByEmailDto): Promise<boolean>;
}
