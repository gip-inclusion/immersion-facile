import { generateApplication } from "src/helpers/generateImmersionApplication";
import { AgencyCode, AgencyDto } from "src/shared/agencies";
import {
  AddImmersionApplicationMLResponseDto,
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
  UpdateImmersionApplicationStatusResponseDto,
} from "src/shared/ImmersionApplicationDto";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Role } from "src/shared/tokens/MagicLinkPayload";

export abstract class ImmersionApplicationGateway {
  abstract add(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<string>;
  abstract addML(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<AddImmersionApplicationMLResponseDto>;
  abstract get(id: ImmersionApplicationId): Promise<ImmersionApplicationDto>;
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

  abstract getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto>;
  abstract getAll(
    agency?: AgencyCode,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>>;

  abstract generateMagicLink(
    applicationId: ImmersionApplicationId,
    role: Role,
  ): Promise<string>;

  abstract listAgencies(): Promise<AgencyDto[]>;

  public async debugPopulateDB(count: number): Promise<Array<string>> {
    const initialArray = Array(count).fill(null);
    const agencies = await this.listAgencies();
    return Promise.all(
      initialArray.map((_, i) => this.add(generateApplication(i, agencies))),
    );
  }
}
