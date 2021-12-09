import React, { useState } from "react";
import "./searchdropdown.css";

type StaticDropdownProps = {
  title: string;
  onSelection: (value: string, index: number) => void;
  inputStyle?: any;
  options: string[];
};

export const StaticDropdown = ({
  title,
  onSelection,
  inputStyle,
  options,
}: StaticDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="autocomplete">
      <label className="inputLabel searchdropdown-header" htmlFor={"search"}>
        {title}
      </label>
      <span
        style={{ position: "relative" }}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <input
          disabled
          id="search"
          type="text"
          className="autocomplete-input"
          autoComplete="off"
          value={options[selectedIndex]}
          style={{ cursor: "pointer", ...inputStyle }}
        />
      </span>

      {isOpen && (
        <div className="autocomplete-items">
          {options.map((option, index) => (
            <div
              key={option}
              className="dropdown-proposal"
              onClick={() => {
                onSelection(option, index);
                setSelectedIndex(index);
                setIsOpen(!isOpen);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
