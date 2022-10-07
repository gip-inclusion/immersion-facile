import { useDispatch } from "react-redux";
import { SearchSortedBy } from "shared";
import { searchSlice } from "src/core-logic/domain/search/search.slice";

export interface SearchInput {
  rome?: string;
  nafDivision?: string;
  lat: number;
  lon: number;
  radiusKm: number;
  address: string;
  sortedBy?: SearchSortedBy;
}

export const useSearchUseCase = () => {
  const dispatch = useDispatch();

  return (values: SearchInput) => {
    dispatch(
      searchSlice.actions.searchRequested({
        rome: values.rome || undefined,
        latitude: values.lat,
        longitude: values.lon,
        distance_km: values.radiusKm,
        address: values.address,
        sortedBy: values.sortedBy,
      }),
    );
  };
};
