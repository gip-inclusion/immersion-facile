import React, { useEffect, useReducer } from "react";
import { StringWithHighlights } from "src/app/ImmersionOffer/StringWithHighlights";
import { useDebounce } from "src/app/useDebounce";
import "./dropdown.css";

type MatchRange = {
  startIndexInclusive: number;
  endIndexExclusive: number;
};

export type Proposal<T> = {
  description: string;
  value: T;
  matchRanges: MatchRange[];
};

type DropDownState<T> = {
  searchTerm: string;
  proposals: Proposal<T>[];
  isOpen: boolean;
};

type DropDownAction<T> =
  | { type: "SEARCH_TERM_CHANGED"; payload: string }
  | { type: "SEARCH_TERM_CHANGED_FROM_OUTSIDE"; payload: string }
  | { type: "PROPOSALS_UPDATED"; payload: Proposal<T>[] }
  | { type: "PROPOSAL_SELECTED"; payload: Proposal<T> };

const reducer = <T extends unknown>(
  state: DropDownState<T>,
  action: DropDownAction<T>,
) => {
  switch (action.type) {
    case "SEARCH_TERM_CHANGED":
      return { ...state, searchTerm: action.payload, isOpen: true };
    case "SEARCH_TERM_CHANGED_FROM_OUTSIDE":
      return { ...state, searchTerm: action.payload };
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

const initialState: DropDownState<unknown> = {
  searchTerm: "",
  proposals: [],
  isOpen: false,
};

type DropDownProps<T> = {
  title: string;
  initialTerm?: string;
  onSelection: (value: T) => void;
  onTermChange: (newTerm: string) => Promise<Proposal<T>[]>;
};

export const DropDown = <T extends unknown>({
  title,
  initialTerm = "",
  onSelection,
  onTermChange,
}: DropDownProps<T>) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { proposals, searchTerm, isOpen } = state;
  const debounceSearchTerm = useDebounce(searchTerm, 1200);

  useEffect(() => {
    onTermChange(debounceSearchTerm).then((proposals) =>
      dispatch({ type: "PROPOSALS_UPDATED", payload: proposals }),
    );
  }, [debounceSearchTerm]);

  useEffect(() => {
    dispatch({
      type: "SEARCH_TERM_CHANGED_FROM_OUTSIDE",
      payload: initialTerm,
    });
  }, [initialTerm]);

  return (
    <div className="dropdown-container">
      <label className="fr-label" htmlFor={"search"}>
        {title}
      </label>
      <input
        id="search"
        type="text"
        className="fr-input"
        value={searchTerm}
        onChange={(e) =>
          dispatch({ type: "SEARCH_TERM_CHANGED", payload: e.target.value })
        }
      />
      {isOpen && (
        <div className="dropdown-proposals">
          {proposals.map((proposal) => (
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
