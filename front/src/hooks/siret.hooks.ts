import { useField } from "formik";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { GetSiretResponseDto, SiretDto } from "shared/src/siret";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";

export const useSiretRelatedField = <K extends keyof GetSiretResponseDto>(
  fieldFromInfo: K,
  options?: {
    fieldToUpdate?: string;
    disabled?: boolean;
  },
) => {
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
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
  const currentSiret = useAppSelector(siretSelectors.currentSiret);
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const siretErrorToDisplay = useAppSelector(
    siretSelectors.siretErrorToDisplay,
  );
  const siretRawError = useAppSelector(siretSelectors.siretRawError);
  const isFetching = useAppSelector(siretSelectors.isFetching);
  const storeShouldFetchEvenIfAlreadySaved = useAppSelector(
    siretSelectors.shouldFetchEvenIfAlreadySaved,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (shouldFetchEvenIfAlreadySaved !== storeShouldFetchEvenIfAlreadySaved)
      dispatch(siretSlice.actions.toggleShouldFetchEvenIfAlreadySaved());
  }, [storeShouldFetchEvenIfAlreadySaved]);

  return {
    currentSiret,
    establishmentInfos: establishmentInfos ?? undefined,
    isFetchingSiret: isFetching,
    siretErrorToDisplay: siretErrorToDisplay ?? undefined,
    siretRawError,
    updateSiret: (newSiret: string) => {
      dispatch(siretSlice.actions.siretModified(newSiret));
    },
  };
};

export const useInitialSiret = (siret?: string) => {
  const currentSiret = useAppSelector(siretSelectors.currentSiret);
  const dispatch = useDispatch();

  useEffect(() => {
    if (siret && siret !== currentSiret) {
      dispatch(siretSlice.actions.siretModified(siret));
    }
  }, []);
};

export const useExistingSiret = (siret?: SiretDto | null) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (siret) dispatch(siretSlice.actions.siretModified(siret));
  }, [siret]);
};
