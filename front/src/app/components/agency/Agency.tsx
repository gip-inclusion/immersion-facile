import React from "react";
import { AgencyOption } from "shared";

export type AgenciesProps = {
  agencies: AgencyOption[];
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
