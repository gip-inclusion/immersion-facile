import {
  RomeSearchRequestDto,
  RomeSearchResponseDto,
} from "../../../shared/rome";
import { logger } from "../../../utils/logger";
import { UseCase } from "../../core/UseCase";
import { RomeGateway } from "../ports/RomeGateway";

export class RomeSearch
  implements UseCase<RomeSearchRequestDto, RomeSearchResponseDto>
{
  private readonly logger = logger.child({ logsource: "RomeSearch" });
  public constructor(readonly romeGateway: RomeGateway) {}

  public async execute(
    searchText: RomeSearchRequestDto,
  ): Promise<RomeSearchResponseDto> {
    const results = await this.romeGateway.searchMetier(searchText);

    return results.map((result) => ({
      romeCodeMetier: result.code,
      description: result.libelle,
      matchRanges: [], // TODO
    }));
  }
}
