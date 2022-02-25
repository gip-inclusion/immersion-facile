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
  fieldToUpdate?: string,
) => {
  const [{ value }, { touched }, { setValue }] = useField<
    GetSiretResponseDto[K]
  >({
    name: fieldToUpdate ?? fieldFromInfo,
  });

  useEffect(() => {
    if (!establishmentInfos) return;
    if (!touched)
      setValue(establishmentInfos && establishmentInfos[fieldFromInfo]);
  }, [establishmentInfos]);
};

export const useSiretFetcher = () => {
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
      if (siretAlreadyExists) {
        setIsFetchingSiret(false);
        return;
      }

      // Does siret exist in Sirene API ?
      if (featureFlags.enableByPassInseeApi) return;

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
