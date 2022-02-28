import { generateApplication } from "src/helpers/generateImmersionApplication";
import { AgencyInListDto, AgencyId } from "src/shared/agencies";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
  UpdateImmersionApplicationStatusResponseDto,
} from "src/shared/ImmersionApplicationDto";
import { LatLonDto } from "src/shared/SearchImmersionDto";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Role } from "src/shared/tokens/MagicLinkPayload";

export abstract class ImmersionApplicationGateway {
  abstract add(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<string>;

  // Get an immersion application through backoffice, password-protected route.
  abstract backofficeGet(
    id: ImmersionApplicationId,
  ): Promise<ImmersionApplicationDto>;
  abstract getML(jwt: string): Promise<ImmersionApplicationDto>;

  abstract update(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<string>;
  abstract updateML(
    immersionApplicationDto: ImmersionApplicationDto,
    jwt: string,
  ): Promise<string>;
  // Calls validate-demande on backend.
  abstract validate(id: ImmersionApplicationId): Promise<string>;

  abstract updateStatus(
    params: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<UpdateImmersionApplicationStatusResponseDto>;

  abstract signApplication(
    jwt: string,
  ): Promise<UpdateImmersionApplicationStatusResponseDto>;

  abstract getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto>;
  abstract getAll(
    agency?: AgencyId,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>>;

  abstract generateMagicLink(
    applicationId: ImmersionApplicationId,
    role: Role,
    expired: boolean,
  ): Promise<string>;

  abstract renewMagicLink(
    expiredJwt: string,
    linkFormat: string,
  ): Promise<void>;

  abstract listAgencies(position: LatLonDto): Promise<AgencyInListDto[]>;

  public async debugPopulateDB(count: number): Promise<Array<string>> {
    const initialArray = Array(count).fill(null);
    const agencies = await this.listAgencies({ lat: 0, lon: 0 });
    return Promise.all(
      initialArray.map((_, i) => this.add(generateApplication(i, agencies))),
    );
  }

  abstract shareByEmail(
    email: string,
    details: string,
    immersionApplicationLink: string,
  ): Promise<boolean>;
}
