import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import type { SiretDto, SiretEstablishmentDto } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { AddressAutocompleteLocator } from "src/core-logic/domain/geocoding/geocoding.slice";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";

export const useSiretRelatedField = <K extends keyof SiretEstablishmentDto>(
  fieldFromInfo: K,
  options?: {
    fieldToUpdate?: string;
    disabled?: boolean;
  },
) => {
  const fieldNameToUpdate = options?.fieldToUpdate ?? fieldFromInfo;
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const { setValue } = useFormContext();
  useEffect(() => {
    if (establishmentInfos && !options?.disabled) {
      setValue(fieldNameToUpdate, establishmentInfos?.[fieldFromInfo], {
        shouldValidate: true,
      });
    }
  }, [
    establishmentInfos,
    setValue,
    options?.disabled,
    fieldNameToUpdate,
    fieldFromInfo,
  ]);
};

type SiretFetcherOptions = {
  shouldFetchEvenIfAlreadySaved: boolean;
  addressAutocompleteLocator: AddressAutocompleteLocator | null;
};

export const useSiretFetcher = ({
  shouldFetchEvenIfAlreadySaved,
  addressAutocompleteLocator,
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
      // TODO: what should shouldFetchEvenIfAlreadySaved do?
      dispatch(
        siretSlice.actions.setShouldFetchEvenIfAlreadySaved({
          shouldFetchEvenIfAlreadySaved,
          addressAutocompleteLocator,
        }),
      );
    return () => {
      if (
        shouldFetchEvenIfAlreadySaved === storeShouldFetchEvenIfAlreadySaved
      ) {
        dispatch(siretSlice.actions.siretInfoClearRequested());
      }
    };
  }, [
    storeShouldFetchEvenIfAlreadySaved,
    shouldFetchEvenIfAlreadySaved,
    addressAutocompleteLocator,
    dispatch,
  ]);

  return {
    currentSiret,
    establishmentInfos: establishmentInfos ?? undefined,
    isFetchingSiret: isFetching,
    siretErrorToDisplay: siretErrorToDisplay ?? undefined,
    siretRawError,
    updateSiret: (newSiret: string) => {
      dispatch(
        siretSlice.actions.siretModified({
          feedbackTopic: "siret-input",
          siret: newSiret,
          addressAutocompleteLocator,
        }),
      );
    },
  };
};

export const useInitialSiret = ({
  siret,
  addressAutocompleteLocator,
  shouldFetch,
}: {
  siret: SiretDto;
  addressAutocompleteLocator: AddressAutocompleteLocator;
  shouldFetch: boolean;
}) => {
  const currentSiret = useAppSelector(siretSelectors.currentSiret);
  const dispatch = useDispatch();

  useEffect(() => {
    if (shouldFetch && siret.length > 0 && siret !== currentSiret) {
      dispatch(
        siretSlice.actions.siretModified({
          siret,
          feedbackTopic: "siret-input",
          addressAutocompleteLocator,
        }),
      );
    }
  }, [siret, currentSiret, addressAutocompleteLocator, dispatch, shouldFetch]);
};

export const useExistingSiret = ({
  siret,
  addressAutocompleteLocator,
  shouldFetch = true,
}: {
  siret?: SiretDto | null;
  addressAutocompleteLocator: AddressAutocompleteLocator;
  shouldFetch?: boolean;
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (siret && shouldFetch) {
      dispatch(
        siretSlice.actions.siretModified({
          feedbackTopic: "siret-input",
          siret: siret,
          addressAutocompleteLocator,
        }),
      );
    }
  }, [siret, dispatch, addressAutocompleteLocator, shouldFetch]);
};
