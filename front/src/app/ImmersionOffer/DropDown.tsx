import React, { useEffect, useReducer } from "react";
import { StringWithHighlights } from "src/app/ImmersionOffer/StringWithHighlights";
import { useDebounce } from "src/app/useDebounce";
import "./dropdown.css";

type MatchRange = {
  startIndexInclusive: number;
  endIndexExclusive: number;
};

export type Proposal = {
  description: string;
  value: string;
  matchRanges: MatchRange[];
};

type DropDownState = {
  searchTerm: string;
  proposals: Proposal[];
  isOpen: boolean;
};

type DropDownAction =
  | { type: "SEARCH_TERM_CHANGED"; payload: string }
  | { type: "PROPOSALS_UPDATED"; payload: Proposal[] }
  | { type: "PROPOSAL_SELECTED"; payload: Proposal };

const reducer = (state: DropDownState, action: DropDownAction) => {
  switch (action.type) {
    case "SEARCH_TERM_CHANGED":
      return { ...state, searchTerm: action.payload, isOpen: true };
    case "PROPOSALS_UPDATED":
      return { ...state, proposals: action.payload };
    case "PROPOSAL_SELECTED":
      return {
        ...state,
        isOpen: false,
        searchTerm: action.payload.description,
      };
    default:
      return state;
  }
};

const initialState: DropDownState = {
  searchTerm: "",
  proposals: [],
  isOpen: false,
};

type DropDownProps = {
  title: string;
  initialValue?: string;
  onSelection: (param: string) => void;
  onTermChange: (newTerm: string) => Promise<Proposal[]>;
};

export const DropDown = ({
  title,
  initialValue,
  onSelection,
  onTermChange,
}: DropDownProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { proposals, searchTerm, isOpen } = state;
  const debounceSearchTerm = useDebounce(searchTerm, 1200);

  useEffect(() => {
    onTermChange(debounceSearchTerm).then((proposals) =>
      dispatch({ type: "PROPOSALS_UPDATED", payload: proposals }),
    );
  }, [debounceSearchTerm]);

  return (
    <div className="dropdown-container">
      <label className="fr-label" htmlFor={"search"}>
        {title}
      </label>
      <input
        id="search"
        type="text"
        className="fr-input"
        value={searchTerm === "" && !isOpen ? initialValue : searchTerm}
        onChange={(e) =>
          dispatch({ type: "SEARCH_TERM_CHANGED", payload: e.target.value })
        }
      />
      {isOpen && (
        <div className="dropdown-proposals">
          {proposals.map((proposal) => (
            <div
              key={proposal.value}
              className="dropdown-proposal"
              onClick={() => {
                dispatch({ type: "PROPOSAL_SELECTED", payload: proposal });
                onSelection(proposal.value);
              }}
            >
              {proposal.value} : <StringWithHighlights {...proposal} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
