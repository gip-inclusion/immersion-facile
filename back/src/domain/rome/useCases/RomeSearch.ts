import {
  RomeSearchRequestDto,
  RomeSearchResponseDto,
} from "../../../shared/rome";
import { UseCase } from "../../core/UseCase";

export class RomeSearch
  implements UseCase<RomeSearchRequestDto, RomeSearchResponseDto>
{
  public async execute(
    searchText: RomeSearchRequestDto
  ): Promise<RomeSearchResponseDto> {
    throw new Error("implement"); // TODO
  }
}
