import { useDispatch } from "react-redux";
import { searchSlice } from "src/core-logic/domain/search/search.slice";

export interface SearchInput {
  rome?: string;
  nafDivision?: string;
  lat: number;
  lon: number;
  radiusKm: number;
  address: string;
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
        sortedBy: "distance",
        address: values.address,
      }),
    );
  };
};
