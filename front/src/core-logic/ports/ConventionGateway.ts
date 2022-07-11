import { Observable } from "rxjs";
import { AdminToken } from "shared/src/admin/admin.dto";
import { AgencyId } from "shared/src/agency/agency.dto";
import {
  ConventionStatus,
  ConventionDto,
  ConventionId,
  UpdateConventionStatusRequestDto,
  WithConventionId,
  ConventionReadDto,
} from "shared/src/convention/convention.dto";
import { ShareLinkByEmailDto } from "shared/src/ShareLinkByEmailDto";
import { Role } from "shared/src/tokens/MagicLinkPayload";

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

  getAll(
    adminToken: AdminToken,
    agency?: AgencyId,
    status?: ConventionStatus,
  ): Promise<Array<ConventionReadDto>>;

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
