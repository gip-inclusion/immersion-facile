import React from "react";
import { StringWithHighlights } from "src/app/FormEstablishment/StringWithHighlights";
import { Proposal, useDropdown } from "src/app/FormEstablishment/useDropdown";
import "./dropdown.css";

type DropDownProps<T> = {
  title: string;
  initialTerm?: string;
  onSelection: (value: T) => void;
  onTermChange: (newTerm: string) => Promise<Proposal<T>[]>;
  headerStyle?: any;
  inputStyle?: any; //< Overrides input class
  disabled?: boolean;
};

export const DropDown = <T extends unknown>({
  title,
  initialTerm = "",
  onSelection,
  onTermChange,
  headerStyle,
  inputStyle,
  disabled,
}: DropDownProps<T>) => {
  const { dispatch, isOpen, error, searchTerm, showSpinner, proposals } =
    useDropdown(onTermChange, initialTerm);

  return (
    <div
      className="search-dropdown-container"
      onBlur={() => {
        // Delay so that any onClick event on the dropdown-proposal has a chance to be registered.
        setTimeout(() => dispatch({ type: "FOCUS_LOST" }), 500);
      }}
    >
      <label className="fr-label" htmlFor={"search"} style={headerStyle}>
        {title}
      </label>
      <input
        id="search"
        type="text"
        className={inputStyle ? "" : "fr-input"}
        autoComplete="off"
        value={searchTerm}
        style={inputStyle}
        onChange={(e) =>
          dispatch({ type: "SEARCH_TERM_CHANGED", payload: e.target.value })
        }
        disabled={disabled}
      />
      {isOpen && (
        <div className="dropdown-proposals">
          {error && <div className="dropdown-error">Erreur: {error}</div>}
          {!error && showSpinner && <div className="dropdown-spinner">...</div>}
          {!error && searchTerm && proposals.length == 0 && !showSpinner && (
            <div className="dropdown-nomatch">(pas de résultats)</div>
          )}
          {!error &&
            proposals.map((proposal) => (
              <div
                key={proposal.description}
                className="dropdown-proposal"
                onClick={() => {
                  dispatch({ type: "PROPOSAL_SELECTED", payload: proposal });
                  onSelection(proposal.value as T);
                }}
              >
                <StringWithHighlights {...proposal} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
