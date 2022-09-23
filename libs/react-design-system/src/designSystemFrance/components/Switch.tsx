import { FormControlLabel, FormGroup } from "@mui/material";
import MuiSwitch from "@mui/material/Switch";
import React from "react";

type SwitchProps = {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
};

export const Switch = ({ checked, label, onChange }: SwitchProps) => (
  <FormGroup>
    <FormControlLabel
      control={
        <MuiSwitch value={checked} checked={checked} onChange={onChange} />
      }
      label={label}
    />
  </FormGroup>
);
