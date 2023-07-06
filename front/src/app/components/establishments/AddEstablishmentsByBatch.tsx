import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Papa from "papaparse";
import { keys, values } from "ramda";
import { makeStyles } from "tss-react/dsfr";
import {
  domElementIds,
  EstablishmentCSVRow,
  FormEstablishmentDto,
} from "shared";
import { DsfrTitle, Loader } from "react-design-system";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { establishmentBatchSelectors } from "src/core-logic/domain/establishmentBatch/establishmentBatch.selectors";
import { establishmentBatchSlice } from "src/core-logic/domain/establishmentBatch/establishmentBatch.slice";

type AddEstablishmentByBatchTabForm = {
  groupName: string;
  inputFile: FileList;
};

export const AddEstablishmentsByBatch = () => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AddEstablishmentByBatchTabForm>();
  const feedback = useAppSelector(establishmentBatchSelectors.feedback);
  const isLoading = useAppSelector(establishmentBatchSelectors.isLoading);
  const addBatchResponse = useAppSelector(
    establishmentBatchSelectors.addBatchResponse,
  );
  const candidateEstablishments = useAppSelector(
    establishmentBatchSelectors.candidateEstablishments,
  );
  const numberOfValidCandidateEstablishments = useAppSelector(
    establishmentBatchSelectors.numberOfValidCandidateEstablishments,
  );
  const numberOfInvalidCandidateEstablishments = useAppSelector(
    establishmentBatchSelectors.numberOfInvalidCandidateEstablishments,
  );
  const onSubmit = (formData: AddEstablishmentByBatchTabForm) => {
    const reader = new FileReader();
    const files = formData.inputFile;
    if (files?.length) {
      const file = files[0];
      reader.addEventListener("load", () => {
        Papa.parse(reader.result as string, papaOptions);
        setFormSubmitted(true);
      });
      reader.readAsDataURL(file);
    }
  };
  const dispatch = useDispatch();
  const papaOptions: Papa.ParseRemoteConfig<EstablishmentCSVRow> = {
    header: true,
    complete: (papaParsedReturn: Papa.ParseResult<unknown>) => {
      setCsvRowsParsed(papaParsedReturn.data);
    },
    download: true,
    skipEmptyLines: true,
  };

  const [csvRowsParsed, setCsvRowsParsed] = useState<unknown[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const tableElement = useRef<HTMLTableElement | null>(null);
  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);
  useEffect(() => {
    if (csvRowsParsed) {
      dispatch(
        establishmentBatchSlice.actions.candidateEstablishmentBatchProvided(
          csvRowsParsed,
        ),
      );
    }
  }, [csvRowsParsed]);
  const onFullscreenClick = async () => {
    isFullscreen
      ? await document.exitFullscreen()
      : await tableElement.current?.requestFullscreen();
  };
  const { classes, cx } = useStyles({
    tableWrapper: {
      background: isFullscreen ? "var(--background-raised-grey)" : "inherit",
      overflow: isFullscreen ? "auto" : "hidden",
    },
    table: {
      display: isFullscreen ? "block" : "none !important",
    },
  });
  const getBatchSuccessMessage = () => (
    <>
      {addBatchResponse && (
        <ul>
          {!!addBatchResponse.numberOfEstablishmentsProcessed && (
            <li>
              {addBatchResponse.numberOfEstablishmentsProcessed} établissements
              traités
            </li>
          )}

          {!!addBatchResponse.numberOfSuccess && (
            <li>
              {addBatchResponse.numberOfSuccess} établissements ajoutés avec
              succès
            </li>
          )}
          {addBatchResponse.failures && addBatchResponse.failures.length && (
            <li>
              <span>
                {addBatchResponse.failures.length} erreurs lors d'ajout
                d'établissements
              </span>
              <ul>
                {addBatchResponse.failures.map((failure) => (
                  <li key={failure.siret}>
                    <strong>{failure.siret}</strong> : {failure.errorMessage}
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      )}
    </>
  );
  const onEstablishmentsImportClick = () => {
    dispatch(
      establishmentBatchSlice.actions.addEstablishmentBatchRequested({
        groupName: getValues().groupName,
        formEstablishments:
          candidateEstablishments
            .filter((establishment) => establishment.zodErrors.length === 0)
            .map(
              (candidateEstablishment) =>
                candidateEstablishment.formEstablishment,
            )
            .filter(
              (formEstablishment): formEstablishment is FormEstablishmentDto =>
                formEstablishment !== null,
            ) ?? [],
      }),
    );
    setFormSubmitted(false);
  };
  return (
    <>
      {isLoading && <Loader />}
      <DsfrTitle level={5} text="Import en masse d'entreprises" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Renseignez un nom de groupe d'entreprises *"
          nativeInputProps={{
            ...register("groupName", { required: true }),
            id: domElementIds.admin.addEstablishmentByBatchTab.groupNameInput,
            placeholder: "Le nom de votre groupement d'entreprise",
            readOnly: formSubmitted,
          }}
          state={errors.groupName ? "error" : "default"}
          stateRelatedMessage={errors.groupName ? "Ce champ est requis" : ""}
        />
        <Input
          label="Uploadez votre CSV *"
          nativeInputProps={{
            ...register("inputFile", { required: true }),
            id: domElementIds.admin.addEstablishmentByBatchTab.inputFileInput,
            readOnly: formSubmitted,
            type: "file",
            accept: ".csv",
          }}
          state={errors.inputFile ? "error" : "default"}
          stateRelatedMessage={errors.inputFile ? "Ce champ est requis" : ""}
        />

        <Button
          title="Vérifier les données à importer"
          className={fr.cx("fr-mt-2w")}
          disabled={formSubmitted}
        >
          Vérifier les données à importer
        </Button>
      </form>

      {!!candidateEstablishments.length && (
        <div className={fr.cx("fr-mt-6w")}>
          <div
            className={cx(
              fr.cx("fr-table", "fr-table--bordered", "fr-mt-4w"),
              classes.tableWrapper,
            )}
            ref={tableElement}
          >
            <div>
              <h3>
                Résumé de l'import à effectuer pour le groupe{" "}
                {getValues("groupName")} :{" "}
              </h3>

              <ul>
                {!!numberOfValidCandidateEstablishments && (
                  <li>
                    <span className={fr.cx("fr-valid-text")}>
                      {numberOfValidCandidateEstablishments} établissement(s)
                      prêts à être importés
                    </span>
                  </li>
                )}
                {!!numberOfInvalidCandidateEstablishments && (
                  <li>
                    <span className={fr.cx("fr-error-text")}>
                      {numberOfInvalidCandidateEstablishments} établissement(s)
                      en erreur et ne seront pas importés
                    </span>
                  </li>
                )}
              </ul>
              <Button
                priority={"tertiary"}
                className={fr.cx("fr-mt-2w")}
                type="button"
                onClick={onFullscreenClick}
              >
                {isFullscreen
                  ? "Fermer le mode plein écran"
                  : "Voir le détail en plein écran"}
              </Button>
              <Button
                title="Importer ces succursales"
                onClick={onEstablishmentsImportClick}
                type="button"
                className={fr.cx("fr-ml-1w")}
              >
                Importer ces succursales
              </Button>
            </div>
            <SubmitFeedbackNotification
              submitFeedback={feedback}
              messageByKind={{
                success: getBatchSuccessMessage(),
              }}
            />
            <table className={cx(fr.cx("fr-mt-2w"), classes.table)}>
              <thead>
                <tr>
                  {keys(candidateEstablishments[0].formEstablishment).map(
                    (key) => (
                      <th scope="col" key={key}>
                        {key}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {candidateEstablishments.map((establishment, index) => (
                  <>
                    {establishment.formEstablishment && (
                      <tr
                        key={`${establishment.formEstablishment.siret}-${index}`}
                        className={cx({})}
                        style={{
                          backgroundColor: establishment.zodErrors.length
                            ? "var(--error-950-100)"
                            : "",
                        }}
                      >
                        {values(establishment.formEstablishment).map(
                          (value, index) => (
                            <>
                              {establishment.formEstablishment && (
                                <td
                                  key={`${establishment.formEstablishment.siret}-value-${index}`}
                                  className={fr.cx("fr-text--xs")}
                                >
                                  {value ? JSON.stringify(value) : ""}
                                </td>
                              )}
                            </>
                          ),
                        )}
                      </tr>
                    )}
                    {establishment.formEstablishment === null && (
                      <tr
                        key={index}
                        className={cx({})}
                        style={{
                          backgroundColor: establishment.zodErrors.length
                            ? "var(--error-950-100)"
                            : "",
                        }}
                      >
                        {establishment.zodErrors.map((error, index) => (
                          <td key={`${error.path}-${index}`}>
                            {error.path} : {error.message}
                          </td>
                        ))}
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

const useStyles = makeStyles<{
  tableWrapper: {
    background: string;
    overflow: "auto" | "hidden";
  };
  table: {
    display: "block" | "none !important";
  };
}>()((_theme, overrides) => ({
  ...overrides,
}));
