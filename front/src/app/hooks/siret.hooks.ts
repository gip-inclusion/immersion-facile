import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch } from "react-redux";
import type { SiretDto, SiretEstablishmentDto } from "shared";
import { useSendModifyEstablishmentLink } from "src/app/hooks/establishment.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
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
      // TODO: what should shouldFetchEvenIfAlreadySaved do?
      dispatch(
        siretSlice.actions.setShouldFetchEvenIfAlreadySaved(
          shouldFetchEvenIfAlreadySaved,
        ),
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
        }),
      );
    },
  };
};

export const useInitialSiret = (siret?: string) => {
  const currentSiret = useAppSelector(siretSelectors.currentSiret);
  const dispatch = useDispatch();

  useEffect(() => {
    if (siret && siret !== currentSiret) {
      dispatch(
        siretSlice.actions.siretModified({
          siret,
          feedbackTopic: "siret-input",
        }),
      );
    }
  }, [siret, currentSiret, dispatch]);
};

export const useExistingSiret = (siret?: SiretDto | null) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (siret) {
      dispatch(
        siretSlice.actions.siretModified({
          feedbackTopic: "siret-input",
          siret: siret,
        }),
      );
    }
  }, [siret, dispatch]);
};

export const useEstablishmentSiret = () => {
  const { currentSiret, updateSiret, siretErrorToDisplay } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: false,
  });
  const isSiretAlreadySaved = useAppSelector(
    siretSelectors.isSiretAlreadySaved,
  );
  const isReadyForRequestOrRedirection = useAppSelector(
    establishmentSelectors.isReadyForRedirection,
  );
  const clearSiret = () => updateSiret("");
  const { sendModifyEstablishmentLink } = useSendModifyEstablishmentLink();
  return {
    currentSiret,
    siretErrorToDisplay,
    isSiretAlreadySaved,
    isReadyForRequestOrRedirection,
    clearSiret,
    updateSiret,
    sendModifyEstablishmentLink,
  };
};
