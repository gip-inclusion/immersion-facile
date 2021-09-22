import {
  AddImmersionOfferResponseDto,
  ImmersionOfferDto,
} from "../../../shared/ImmersionOfferDto";
import { UseCase } from "../../core/UseCase";

export class AddImmersionOffer
  implements UseCase<ImmersionOfferDto, AddImmersionOfferResponseDto>
{
  public async execute(
    dto: ImmersionOfferDto
  ): Promise<AddImmersionOfferResponseDto> {
    throw new Error("implement"); // TODO
  }
}
