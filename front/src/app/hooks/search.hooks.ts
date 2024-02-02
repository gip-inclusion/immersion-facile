import { useDispatch } from "react-redux";
import { routes } from "src/app/routes/routes";
import { getUrlParameters } from "src/app/utils/url.utils";
import {
  SearchPageParams,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";

export const useSearchUseCase = () => {
  const dispatch = useDispatch();
  const urlParams = getUrlParameters(window.location);
  return (values: SearchPageParams) => {
    const appellationCodes = values.appellations?.map(
      (appellation) => appellation.appellationCode,
    );
    dispatch(
      searchSlice.actions.searchRequested({ ...values, appellationCodes }),
    );
    routes
      .search({
        ...urlParams,
        ...values,
      })
      .replace();
  };
};
