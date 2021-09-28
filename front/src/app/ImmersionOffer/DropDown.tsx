import React, { useEffect, useReducer } from "react";
import { StringWithHighlights } from "src/app/ImmersionOffer/StringWithHighlights";
import { immersionOfferGateway } from "src/app/main";
import { useDebounce } from "src/app/useDebounce";
import type {
  RomeSearchMatchDto,
  RomeSearchResponseDto,
} from "src/shared/rome";
import "./dropdown.css";

type DropDownProps = {
  title: string;
  onSelection: (param: string) => void;
};

type DropDownState = {
  searchTerm: string;
  proposals: RomeSearchResponseDto;
  isOpen: boolean;
};

type DropDownAction =
  | { type: "SEARCH_TERM_CHANGED"; payload: string }
  | { type: "PROPOSALS_UPDATED"; payload: RomeSearchResponseDto }
  | { type: "PROPOSAL_SELECTED"; payload: RomeSearchMatchDto };

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

export const DropDown = ({ title, onSelection }: DropDownProps) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { proposals, searchTerm, isOpen } = state;
  const debounceSearchTerm = useDebounce(searchTerm, 1200);

  useEffect(() => {
    if (!debounceSearchTerm) return;
    immersionOfferGateway
      .searchProfession(debounceSearchTerm)
      .then((proposals) =>
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
        value={searchTerm}
        onChange={(e) =>
          dispatch({ type: "SEARCH_TERM_CHANGED", payload: e.target.value })
        }
      />
      {isOpen && (
        <div className="dropdown-proposals">
          {proposals.map((proposal) => (
            <div
              key={proposal.romeCodeMetier}
              className="dropdown-proposal"
              onClick={() => {
                dispatch({ type: "PROPOSAL_SELECTED", payload: proposal });
                onSelection(proposal.romeCodeMetier);
              }}
            >
              {proposal.romeCodeMetier} : <StringWithHighlights {...proposal} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
