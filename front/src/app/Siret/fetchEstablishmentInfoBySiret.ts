import type { AxiosError } from "axios";
import { useField } from "formik";
import { useEffect, useRef, useState } from "react";
import {
  immersionApplicationGateway,
  formEstablishmentGateway,
} from "src/app/dependencies";
import { useFeatureFlagsContext } from "src/app/FeatureFlagContext";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { siretSchema } from "../../shared/siret";

export const useSiretRelatedField = <K extends keyof GetSiretResponseDto>(
  fieldFromInfo: K,
  establishmentInfos: GetSiretResponseDto | undefined,
  options?: {
    fieldToUpdate?: string;
    disabled?: boolean;
  },
) => {
  const [{ value }, { touched }, { setValue }] = useField<
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
  fetchSirenApiEvenAlreadyInDb: boolean;
  disabled: boolean;
};

export const useSiretFetcher = (options: SiretFetcherOptions) => {
  const featureFlags = useFeatureFlagsContext();
  const [isFetchingSiret, setIsFetchingSiret] = useState(false);
  const [siretAlreadyExists, setSiretAlreadyExists] = useState(false);
  const [establishmentInfo, setEstablishmentInfo] = useState<
    GetSiretResponseDto | undefined
  >();

  const [field, _, { setValue, setError, setTouched }] = useField<string>({
    name: "siret",
  });
  const validatedSiret = useRef<SiretDto>(field.value);

  useEffect(() => {
    if (options.disabled) return;

    (async () => {
      try {
        validatedSiret.current = siretSchema.parse(field.value);
      } catch (e: any) {
        return;
      }
      setIsFetchingSiret(true);
      setTouched(true);
      // Does siret already exist in our form repository ?
      const siretAlreadyExists =
        await formEstablishmentGateway.getSiretAlreadyExists(
          validatedSiret.current,
        );
      setSiretAlreadyExists(siretAlreadyExists);
      if (siretAlreadyExists && !options.fetchSirenApiEvenAlreadyInDb) {
        setIsFetchingSiret(false);
        return;
      }

      // Does siret exist in Sirene API ?
      if (featureFlags.enableByPassInseeApi) {
        setIsFetchingSiret(false);
        return;
      }

      try {
        const response = await immersionApplicationGateway.getSiretInfo(
          validatedSiret.current,
        );
        setEstablishmentInfo(response);
      } catch (err: any) {
        if (err.isAxiosError && err.response && err.response.status === 404) {
          setError(
            "Ce SIRET n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.",
          );
        } else {
          setError(err.response?.data.errors ?? err.message);
        }
      } finally {
        setIsFetchingSiret(false);
      }
    })();
  }, [field.value]);

  return {
    establishmentInfo,
    siretAlreadyExists,
    isFetchingSiret,
    siret: validatedSiret.current,
  };
};
