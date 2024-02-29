import { NafDto, NumberEmployeesRange, SiretDto } from "shared";
import { getSiretEstablishmentFromApi } from "../domains/core/sirene/helpers/getSirenEstablishmentFromApi";
import { SiretGateway } from "../domains/core/sirene/ports/SirenGateway";

export type NafAndNumberOfEmpolyee = {
  nafDto: NafDto;
  numberEmployeesRange: NumberEmployeesRange;
};

export const getNafAndNumberOfEmployee = async (
  siretGateway: SiretGateway,
  siret: SiretDto,
): Promise<NafAndNumberOfEmpolyee> => {
  const { nafDto, numberEmployeesRange } = await getSiretEstablishmentFromApi(
    { siret },
    siretGateway,
  );

  if (!nafDto || numberEmployeesRange === undefined)
    throw new Error(
      `Some field from siret gateway are missing for establishment with siret ${siret} : nafDto=${nafDto}; numberEmployeesRange=${numberEmployeesRange}`,
    );

  return {
    nafDto,
    numberEmployeesRange,
  };
};
