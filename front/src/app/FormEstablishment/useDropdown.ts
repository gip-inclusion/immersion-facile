import { useEffect, useReducer } from "react";
import { useDebounce } from "src/app/useDebounce";

const shouldNeverBeCalled = (param: never) => {
  throw new Error("should never be called");
};

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
  showSpinner: boolean;
  isSearchTermFromDropDown: boolean;
  error?: string;
};

type DropDownAction<T> =
  | { type: "SEARCH_TERM_CHANGED"; payload: string }
  | { type: "SEARCH_TERM_CHANGED_FROM_OUTSIDE"; payload: string }
  | { type: "PROPOSALS_UPDATED"; payload: Proposal<T>[] }
  | { type: "PROPOSAL_SELECTED"; payload: Proposal<T> }
  | { type: "FOCUS_LOST" }
  | { type: "ERROR"; payload: string };

const reducer = <T extends unknown>(
  state: DropDownState<T>,
  action: DropDownAction<T>,
) => {
  switch (action.type) {
    case "SEARCH_TERM_CHANGED":
      return {
        ...state,
        searchTerm: action.payload,
        proposals: [],
        isOpen: !!action.payload,
        showSpinner: !!action.payload,
        isSearchTermFromDropDown: false,
        error: undefined,
      };
    case "SEARCH_TERM_CHANGED_FROM_OUTSIDE":
      return { ...state, searchTerm: action.payload, error: undefined };
    case "PROPOSALS_UPDATED":
      return { ...state, proposals: action.payload, showSpinner: false };
    case "PROPOSAL_SELECTED":
      return {
        ...state,
        isOpen: false,
        searchTerm: action.payload.description,
        isSearchTermFromDropDown: true,
        error: undefined,
      };
    case "FOCUS_LOST":
      return {
        ...state,
        isOpen: false,
        searchTerm: state.isSearchTermFromDropDown
          ? state.searchTerm
          : initialState.searchTerm,
        error: undefined,
      };
    case "ERROR":
      return {
        ...state,
        showSpinner: false,
        error: action.payload,
      };
    default: {
      shouldNeverBeCalled(action);
      return state;
    }
  }
};

const initialState: DropDownState<unknown> = {
  searchTerm: "",
  proposals: [],
  isOpen: false,
  showSpinner: false,
  isSearchTermFromDropDown: false,
};

export const useDropdown = <T extends unknown>(
  onTermChange: (newTerm: string) => Promise<Proposal<T>[]>,
  initialTerm: string,
) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { proposals, searchTerm, isOpen, showSpinner, error } = state;
  const debounceSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    onTermChange(debounceSearchTerm)
      .then((proposals) =>
        dispatch({ type: "PROPOSALS_UPDATED", payload: proposals }),
      )
      .catch((e: any) => {
        console.log(e);
        dispatch({ type: "ERROR", payload: e.message });
      });
  }, [debounceSearchTerm]);

  useEffect(() => {
    dispatch({
      type: "SEARCH_TERM_CHANGED_FROM_OUTSIDE",
      payload: initialTerm,
    });
  }, [initialTerm]);

  return { dispatch, isOpen, error, searchTerm, showSpinner, proposals };
};
