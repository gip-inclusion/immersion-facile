import React, { useEffect, useRef, useState } from "react";
import "./searchdropdown.css";

type StaticDropdownProps = {
  title: string;
  onSelection: (value: string, index: number) => void;
  inputStyle?: any;
  options: string[];
  defaultSelectedIndex?: number;
  placeholder: string;
  id: string;
};

export const StaticDropdown = ({
  title,
  onSelection,
  inputStyle,
  options,
  defaultSelectedIndex = 0,
  placeholder,
  id = "im-static-dropdown",
}: StaticDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);
  const toggler = useRef(null);
  const buttonClear = useRef(null);
  useEffect(() => {
    function handleClickOutsideToggler(event: MouseEvent) {
      if (
        toggler.current &&
        !(toggler.current as Element).contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutsideToggler);
    return () => {
      document.removeEventListener("click", handleClickOutsideToggler);
    };
  }, [toggler]);
  useEffect(() => {
    setSelectedIndex(defaultSelectedIndex);
  }, [defaultSelectedIndex]);
  const onClearButtonClick = () => {
    setSelectedIndex(-1);
    onSelection("", -1);
  };
  return (
    <div className="autocomplete">
      <label className="inputLabel searchdropdown-header" htmlFor={"search"}>
        {title}
      </label>

      <div className={"searchdropdown__inner"}>
        <button
          type={"button"}
          className={"searchdropdown__toggler"}
          ref={toggler}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        ></button>
        {selectedIndex > -1 && (
          <button
            type={"button"}
            className={"searchdropdown__button-clear fr-icon-close-circle-line"}
            ref={buttonClear}
            onClick={onClearButtonClick}
          ></button>
        )}

        <input
          readOnly
          id={id}
          type="text"
          className="fr-input autocomplete-input"
          autoComplete="off"
          value={selectedIndex > -1 ? options[selectedIndex] : ""}
          style={{ cursor: "pointer", ...inputStyle }}
          placeholder={placeholder}
        />
      </div>

      {isOpen && (
        <div className="autocomplete-items">
          {options.map((option, index) => (
            <div
              key={option}
              className="dropdown-proposal"
              onClick={() => {
                const newIndex = index === selectedIndex ? -1 : index; // Unselect if index already selected
                onSelection(options[newIndex], newIndex);
                setSelectedIndex(newIndex);
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
