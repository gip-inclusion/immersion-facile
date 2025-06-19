import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Papa from "papaparse";
import { keys, values } from "ramda";
import { type ElementRef, Fragment, useEffect, useRef, useState } from "react";
import { Loader } from "react-design-system";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  domElementIds,
  type EstablishmentCSVRow,
  type FormEstablishmentDto,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { establishmentBatchSelectors } from "src/core-logic/domain/establishmentBatch/establishmentBatch.selectors";
import { establishmentBatchSlice } from "src/core-logic/domain/establishmentBatch/establishmentBatch.slice";
import { makeStyles } from "tss-react/dsfr";
import { BackofficeDashboardTabContent } from "../../layout/BackofficeDashboardTabContent";

type AddEstablishmentByBatchTabForm = {
  groupName: string;
  title: string;
  description: string;
  inputFile: FileList;
};

export const AddEstablishmentsByBatch = () => {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, touchedFields },
  } = useForm<AddEstablishmentByBatchTabForm>();
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
  const shouldDisableSubmitButton = keys(touchedFields).length === 0;
  const onSubmit = (formData: AddEstablishmentByBatchTabForm) => {
    const reader = new FileReader();
    const files = formData.inputFile;
    if (files?.length) {
      const file = files[0];
      reader.addEventListener("load", () => {
        Papa.parse(reader.result as string, papaOptions);
      });
      reader.readAsDataURL(file);
    }
    reset(getValues(), {
      keepTouched: false,
    });
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

  const tableElement = useRef<ElementRef<"table">>(null);

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
  }, [csvRowsParsed, dispatch]);
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
          {addBatchResponse.failures &&
            addBatchResponse.failures.length > 0 && (
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
    const values = getValues();
    dispatch(
      establishmentBatchSlice.actions.addEstablishmentBatchRequested({
        formEstablishmentBatch: {
          groupName: values.groupName,
          title: values.title,
          description: values.description,
          formEstablishments:
            candidateEstablishments
              .filter((establishment) => establishment.zodErrors.length === 0)
              .map(
                (candidateEstablishment) =>
                  candidateEstablishment.formEstablishment,
              )
              .filter(
                (
                  formEstablishment,
                ): formEstablishment is FormEstablishmentDto =>
                  formEstablishment !== null,
              ) ?? [],
        },
        feedbackTopic: "establishments-batch",
      }),
    );
  };
  return (
    <BackofficeDashboardTabContent
      title="Import en masse d'entreprises"
      className={fr.cx("fr-mt-4w")}
    >
      {isLoading && <Loader />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Renseignez un nom de groupe d'entreprises *"
          nativeInputProps={{
            ...register("groupName", { required: true }),
            id: domElementIds.admin.manageEstablishment.groupNameInput,
            placeholder: "Le nom de votre groupement d'entreprise",
          }}
          state={errors.groupName ? "error" : "default"}
          stateRelatedMessage={errors.groupName ? "Ce champ est requis" : ""}
        />
        <Input
          label="Renseignez un titre (qui apparaitra dans la page du groupe) *"
          nativeInputProps={{
            ...register("title", { required: true }),
            id: domElementIds.admin.manageEstablishment.titleInput,
            placeholder: "Ex: Semaine de l'agro-alimentaire 2023",
          }}
          state={errors.title ? "error" : "default"}
          stateRelatedMessage={errors.title ? "Ce champ est requis" : ""}
        />
        <Input
          textArea
          label="Renseignez une description (qui apparaitra dans la page du groupe) *"
          nativeTextAreaProps={{
            ...register("description", { required: true }),
            id: domElementIds.admin.manageEstablishment.descriptionInput,
            placeholder:
              "Ex: La super semaine de l'agro-alimentaire, du 12 au 16 novembre, etc... Rencontrez des entreprises sympas !",
          }}
          state={errors.description ? "error" : "default"}
          stateRelatedMessage={errors.description ? "Ce champ est requis" : ""}
        />
        <Input
          label="Uploadez votre CSV *"
          nativeInputProps={{
            ...register("inputFile", { required: true }),
            id: domElementIds.admin.manageEstablishment.inputFileInput,
            type: "file",
            accept: ".csv",
          }}
          state={errors.inputFile ? "error" : "default"}
          stateRelatedMessage={errors.inputFile ? "Ce champ est requis" : ""}
          hintText={
            <>
              Pour vous aider à remplir le csv, vous pouvez vous baser sur{" "}
              <a
                href="https://immersion.cellar-c2.services.clever-cloud.com/example-batch-establishment.csv"
                target="_blank"
                rel="noreferrer"
              >
                notre template
              </a>
            </>
          }
        />
        <Button
          title="Vérifier les données à importer"
          className={fr.cx("fr-mt-2w")}
          disabled={shouldDisableSubmitButton}
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
            <Feedback
              topics={["establishments-batch"]}
              render={({ level }) => (
                <Alert
                  severity={level}
                  className={fr.cx("fr-mt-2w")}
                  title="Succès"
                  description={getBatchSuccessMessage()}
                />
              )}
            />

            <table className={cx(fr.cx("fr-mt-2w"), classes.table)}>
              {candidateEstablishments[0].formEstablishment && (
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
              )}
              <tbody>
                {candidateEstablishments.map((establishment, index) => (
                  <Fragment
                    key={`${establishment.formEstablishment?.siret}-${index}`}
                  >
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
                          (value) => {
                            const valueKey = JSON.stringify(value);
                            return (
                              <Fragment
                                key={`${establishment.formEstablishment?.siret}-${valueKey}`}
                              >
                                {establishment.formEstablishment && (
                                  <td className={fr.cx("fr-text--xs")}>
                                    {value ? JSON.stringify(value) : ""}
                                  </td>
                                )}
                              </Fragment>
                            );
                          },
                        )}
                      </tr>
                    )}
                    {establishment.formEstablishment === null && (
                      <tr
                        // biome-ignore lint/suspicious/noArrayIndexKey: Index is ok here
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
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </BackofficeDashboardTabContent>
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
