import React from "react";

export interface ArrayDropdownProps {
  labels: string[];
  didPick: (index: number, label: string) => void;
}

export const ArrayDropdown = ({ labels, didPick }: ArrayDropdownProps) => {
  const onChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    const index = event.currentTarget.selectedIndex;
    const label = labels.at(index);
    if (label) return didPick(index, label);
    throw new Error(`No label at index ${index}`);
  };
  return (
    <>
      <select
        className="fr-select"
        id="roles-dropdown"
        name="select"
        onChange={onChange}
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
