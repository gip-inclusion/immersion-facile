import { Observable } from "rxjs";
import { AgencyId } from "shared/src/agency/agency.dto";
import {
  ConventionStatus,
  ConventionDto,
  ConventionId,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { ShareLinkByEmailDto } from "shared/src/ShareLinkByEmailDto";
import { Role } from "shared/src/tokens/MagicLinkPayload";

export interface ConventionGateway {
  retreiveFromToken(payload: string): Observable<ConventionDto | undefined>;
  add(conventionDto: ConventionDto): Promise<string>;

  // Get an immersion application through backoffice, password-protected route.
  backofficeGet(id: ConventionId): Promise<ConventionDto>;
  getMagicLink(jwt: string): Promise<ConventionDto>;

  update(conventionDto: ConventionDto): Promise<string>;
  updateMagicLink(conventionDto: ConventionDto, jwt: string): Promise<string>;
  // Calls validate-demande on backend.
  validate(id: ConventionId): Promise<string>;

  updateStatus(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Promise<WithConventionId>;

  signApplication(jwt: string): Promise<WithConventionId>;

  getAll(
    agency?: AgencyId,
    status?: ConventionStatus,
  ): Promise<Array<ConventionDto>>;

  generateMagicLink(
    applicationId: ConventionId,
    role: Role,
    expired: boolean,
  ): Promise<string>;

  renewMagicLink(expiredJwt: string, linkFormat: string): Promise<void>;

  // shareLinkByEmailDTO
  shareLinkByEmail(shareLinkByEmailDTO: ShareLinkByEmailDto): Promise<boolean>;
}
