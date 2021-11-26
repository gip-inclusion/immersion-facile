import React, { ChangeEvent, useState } from "react";

interface ArrayDropdownProps {
  labels: string[];
  didPick: (index: number, label: string) => void;
}

export const ArrayDropdown = ({ labels, didPick }: ArrayDropdownProps) => {
  const handleDropdownChange = (evt: ChangeEvent) => {
    const target = evt.currentTarget as HTMLSelectElement;
    didPick(target.selectedIndex, labels[target.selectedIndex]);
  };

  return (
    <>
      <select
        className="fr-select"
        id="roles-dropdown"
        name="select"
        onChange={handleDropdownChange}
        style={{ width: "200px" }}
      >
        {labels.map((label) => (
          <option value={label} key={label}>
            {label}
          </option>
        ))}
      </select>
    </>
  );
};
