import {
  errors,
  type NafDto,
  type NumberEmployeesRange,
  type SiretDto,
} from "shared";
import { getSiretEstablishmentFromApi } from "../domains/core/sirene/helpers/getSirenEstablishmentFromApi";
import type { SiretGateway } from "../domains/core/sirene/ports/SiretGateway";

export type NafAndNumberOfEmpolyee = {
  nafDto: NafDto;
  numberEmployeesRange: NumberEmployeesRange;
};

export const getNafAndNumberOfEmployee = async (
  siretGateway: SiretGateway,
  siret: SiretDto,
): Promise<NafAndNumberOfEmpolyee> => {
  const siretEstablishment = await getSiretEstablishmentFromApi(
    { siret },
    siretGateway,
  );

  if (!siretEstablishment) throw errors.siretApi.notFound({ siret });

  if (
    !siretEstablishment.nafDto ||
    siretEstablishment.numberEmployeesRange === undefined
  )
    throw new Error(
      `Some field from siret gateway are missing for establishment with siret ${siret} : nafDto=${siretEstablishment.nafDto}; numberEmployeesRange=${siretEstablishment.numberEmployeesRange}`,
    );

  return {
    nafDto: siretEstablishment.nafDto,
    numberEmployeesRange: siretEstablishment.numberEmployeesRange,
  };
};
