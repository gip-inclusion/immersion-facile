import React from "react";
import { AgencyInListDto } from "src/shared/agency/agency.dto";

export type AgenciesProps = {
  agencies: AgencyInListDto[];
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
