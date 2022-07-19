import React from "react";
import { AgencyIdAndName } from "shared/src/agency/agency.dto";

export type AgenciesProps = {
  agencies: AgencyIdAndName[];
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
