import { EstablishmentInfoFromSiretApi } from "src/core-logic/ports/EstablishmentInfoFromSiretApi";
import {
  AddImmersionApplicationMLResponseDto,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
  UpdateImmersionApplicationStatusResponseDto,
} from "src/shared/ImmersionApplicationDto";
import { generateApplication } from "src/helpers/generateImmersionApplication";

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

  abstract getSiretInfo(siret: string): Promise<EstablishmentInfoFromSiretApi>;
  abstract getAll(): Promise<Array<ImmersionApplicationDto>>;

  public debugPopulateDB(count: number): Promise<Array<string>> {
    const initialArray = Array(count).fill(null);
    return Promise.all(
      initialArray.map((_, i) => this.add(generateApplication(i))),
    );
  }
}
