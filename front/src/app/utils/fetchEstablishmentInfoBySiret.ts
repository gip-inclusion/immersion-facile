import { useField } from "formik";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { GetSiretResponseDto } from "shared/src/siret";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { siretStateSelector } from "src/core-logic/domain/siret/siret.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";

export const useSiretRelatedField = <K extends keyof GetSiretResponseDto>(
  fieldFromInfo: K,
  establishmentInfos: GetSiretResponseDto | undefined,
  options?: {
    fieldToUpdate?: string;
    disabled?: boolean;
  },
) => {
  const [{ value: _ }, { touched }, { setValue }] = useField<
    GetSiretResponseDto[K]
  >({
    name: options?.fieldToUpdate ?? fieldFromInfo,
  });

  useEffect(() => {
    if (options?.disabled) return;
    if (!establishmentInfos) return;
    if (!touched)
      setValue(establishmentInfos && establishmentInfos[fieldFromInfo]);
  }, [establishmentInfos]);
};

type SiretFetcherOptions = {
  shouldFetchEvenIfAlreadySaved: boolean;
};

export const useSiretFetcher = ({
  shouldFetchEvenIfAlreadySaved,
}: SiretFetcherOptions) => {
  const siretState = useAppSelector(siretStateSelector);
  const dispatch = useDispatch();
  useEffect(() => {
    if (
      shouldFetchEvenIfAlreadySaved !== siretState.shouldFetchEvenIfAlreadySaved
    )
      dispatch(siretSlice.actions.toggleShouldFetchEvenIfAlreadySaved());
  }, [siretState.shouldFetchEvenIfAlreadySaved]);

  return {
    currentSiret: siretState.currentSiret,
    establishmentInfo: siretState.establishment ?? undefined,
    isFetchingSiret: siretState.isSearching,
    siretError: siretState.error ?? undefined,
    updateSiret: (newSiret: string) =>
      dispatch(siretSlice.actions.siretModified(newSiret)),
  };
};
