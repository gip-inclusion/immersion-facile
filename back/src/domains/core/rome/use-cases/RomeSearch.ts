import {
  ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH,
  type RomeDto,
  zStringMinLength1Max1024,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";

export type RomeSearch = ReturnType<typeof makeRomeSearch>;

export const makeRomeSearch = useCaseBuilder("RomeSearch")
  .withInput(zStringMinLength1Max1024)
  .withOutput<RomeDto[]>()
  .build(async ({ inputParams, uow }) =>
    inputParams.length < ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH
      ? []
      : uow.romeRepository.searchRome(inputParams),
  );
