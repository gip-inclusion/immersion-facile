import { AgencyId } from "shared/src/agency/agency.dto";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
  WithImmersionApplicationId,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ShareLinkByEmailDTO } from "shared/src/ShareLinkByEmailDTO";
import { Role } from "shared/src/tokens/MagicLinkPayload";

export interface ImmersionApplicationGateway {
  add(immersionApplicationDto: ImmersionApplicationDto): Promise<string>;

  // Get an immersion application through backoffice, password-protected route.
  backofficeGet(id: ImmersionApplicationId): Promise<ImmersionApplicationDto>;
  getMagicLink(jwt: string): Promise<ImmersionApplicationDto>;

  update(immersionApplicationDto: ImmersionApplicationDto): Promise<string>;
  updateMagicLink(
    immersionApplicationDto: ImmersionApplicationDto,
    jwt: string,
  ): Promise<string>;
  // Calls validate-demande on backend.
  validate(id: ImmersionApplicationId): Promise<string>;

  updateStatus(
    params: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<WithImmersionApplicationId>;

  signApplication(jwt: string): Promise<WithImmersionApplicationId>;

  getAll(
    agency?: AgencyId,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>>;

  generateMagicLink(
    applicationId: ImmersionApplicationId,
    role: Role,
    expired: boolean,
  ): Promise<string>;

  renewMagicLink(expiredJwt: string, linkFormat: string): Promise<void>;

  // shareLinkByEmailDTO
  shareLinkByEmail(shareLinkByEmailDTO: ShareLinkByEmailDTO): Promise<boolean>;
}
