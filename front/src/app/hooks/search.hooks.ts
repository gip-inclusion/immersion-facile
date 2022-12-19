import { useDispatch } from "react-redux";
import { routes } from "src/app/routes/routes";
import {
  SearchPageParams,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";

export const useSearchUseCase = () => {
  const dispatch = useDispatch();

  return (values: SearchPageParams) => {
    dispatch(searchSlice.actions.searchRequested(values));
    routes.search(values).replace();
  };
};

export const useFullSearchUseCase = () => {
  const dispatch = useDispatch();

  return (values: SearchPageParams) => {
    dispatch(searchSlice.actions.initialFullSearchRequested(values));
    routes.searchV2(values).replace();
  };
};
