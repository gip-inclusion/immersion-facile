import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { SirenEstablishmentDto, SiretDto } from "shared";
import { useFormContext } from "react-hook-form";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSendModifyEstablishmentLink } from "src/app/hooks/establishment.hooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { siretSlice } from "src/core-logic/domain/siret/siret.slice";
import { establishmentSelectors } from "src/core-logic/domain/establishmentPath/establishment.selectors";

export const useSiretRelatedField = <K extends keyof SirenEstablishmentDto>(
  fieldFromInfo: K,
  options?: {
    fieldToUpdate?: string;
    disabled?: boolean;
  },
) => {
  const fieldNameToUpdate = options?.fieldToUpdate ?? fieldFromInfo;
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const { formState, setValue } = useFormContext();
  const touched = formState.touchedFields[fieldNameToUpdate];
  useEffect(() => {
    if (options?.disabled) return;
    if (!establishmentInfos) return;
    if (!touched)
      setValue(
        fieldNameToUpdate,
        establishmentInfos && establishmentInfos[fieldFromInfo],
        {
          shouldValidate: true,
        },
      );
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
      dispatch(
        siretSlice.actions.setShouldFetchEvenIfAlreadySaved(
          shouldFetchEvenIfAlreadySaved,
        ),
      );
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

export const useEstablishmentSiret = (
  siretFetcherOptions: SiretFetcherOptions,
) => {
  const { currentSiret, updateSiret, siretErrorToDisplay } =
    useSiretFetcher(siretFetcherOptions);
  const isSiretAlreadySaved = useAppSelector(
    siretSelectors.isSiretAlreadySaved,
  );
  const isReadyForRequestOrRedirection = useAppSelector(
    establishmentSelectors.isReadyForLinkRequestOrRedirection,
  );
  const clearSiret = () => updateSiret("");
  const { sendModifyEstablishmentLink } = useSendModifyEstablishmentLink();

  const modifyLinkWasSent = useAppSelector(
    establishmentSelectors.wasModifyLinkSent,
  );
  return {
    currentSiret,
    siretErrorToDisplay,
    isSiretAlreadySaved,
    isReadyForRequestOrRedirection,
    clearSiret,
    updateSiret,
    sendModifyEstablishmentLink,
    modifyLinkWasSent,
  };
};
