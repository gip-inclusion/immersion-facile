import React from "react";
import { AgencyWithPositionDto } from "shared/src/agency/agency.dto";

export type AgenciesProps = {
  agencies: AgencyWithPositionDto[];
};

export const Agencies = ({ agencies }: AgenciesProps) => (
  <>
    {agencies.map(({ id, name }) => (
      <option value={id} key={id} label={name}>
        {name}
      </option>
    ))}
  </>
);
