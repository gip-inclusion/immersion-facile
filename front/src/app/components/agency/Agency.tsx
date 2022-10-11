import React from "react";
import { AgencyIdAndName } from "shared";

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
