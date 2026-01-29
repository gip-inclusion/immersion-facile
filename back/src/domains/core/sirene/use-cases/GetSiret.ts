import {
  type GetSiretRequestDto,
  getSiretRequestSchema,
  type SiretEstablishmentDto,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";
import { getSiretEstablishmentFromApi } from "../helpers/getSirenEstablishmentFromApi";
import type { SiretGateway } from "../ports/SiretGateway";

export type GetSiret = ReturnType<typeof makeGetSiret>;

export const makeGetSiret = useCaseBuilder("GetSiret")
  .notTransactional()
  .withInput<GetSiretRequestDto>(getSiretRequestSchema)
  .withOutput<SiretEstablishmentDto | null>()
  .withDeps<{ siretGateway: SiretGateway }>()
  .build(async ({ inputParams, deps }) =>
    getSiretEstablishmentFromApi(inputParams, deps.siretGateway),
  );
