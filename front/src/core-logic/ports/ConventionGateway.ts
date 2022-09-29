import { Observable } from "rxjs";
import {
  AdminToken,
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  Role,
  ShareLinkByEmailDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared";

export interface ConventionGateway {
  retrieveFromToken(payload: string): Observable<ConventionReadDto | undefined>;
  add(conventionDto: ConventionDto): Promise<string>;

  // Get an immersion application through backoffice, password-protected route.
  getById(id: ConventionId): Promise<ConventionReadDto>;
  getMagicLink(jwt: string): Promise<ConventionReadDto>;

  update(conventionDto: ConventionDto): Promise<string>;
  updateMagicLink(conventionDto: ConventionDto, jwt: string): Promise<string>;

  updateStatus(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Promise<WithConventionId>;

  signApplication(jwt: string): Promise<WithConventionId>;

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
