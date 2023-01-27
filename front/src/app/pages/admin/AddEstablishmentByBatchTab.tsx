import React, { useEffect, useRef, useState } from "react";
import { DsfrTitle } from "react-design-system";
import Papa from "papaparse";
import Button from "@codegouvfr/react-dsfr/Button";
import { keys, values } from "ramda";
import { makeStyles } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";
import { useForm } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { useDispatch } from "react-redux";
import {
  establishmentBatchSlice,
  EstablishmentCSVRow,
} from "src/core-logic/domain/establishmentBatch/establishmentBatch.slice";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { establishmentBatchSelectors } from "src/core-logic/domain/establishmentBatch/establishmentBatch.selectors";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";

type AddEstablishmentByBatchTabForm = {
  groupName: string;
  inputFile: FileList;
};

export const AddEstablishmentByBatchTab = () => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<AddEstablishmentByBatchTabForm>();
  const feedback = useAppSelector(establishmentBatchSelectors.feedback);
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
    complete: (papaParsedReturn: Papa.ParseResult<EstablishmentCSVRow>) =>
      setCsvRowsParsed(papaParsedReturn),
    download: true,
  };

  const [csvRowsParsed, setCsvRowsParsed] =
    useState<Papa.ParseResult<EstablishmentCSVRow> | null>(null);
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
          csvRowsParsed.data,
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
    },
    table: {
      maxHeight: isFullscreen ? "90vh" : "0",
      overflow: isFullscreen ? "auto" : "hidden",
    },
  });
  return (
    <div className="admin-tab__import-batch-establishment">
      <DsfrTitle level={5} text="Import en masse d'entreprises" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Renseignez un nom de groupe d'entreprises *"
          nativeInputProps={{
            ...register("groupName", { required: true }),
            id: "groupName-input",
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
            id: "inputFile-input",
            readOnly: formSubmitted,
            type: "file",
            accept: ".csv",
          }}
          state={errors.inputFile ? "error" : "default"}
          stateRelatedMessage={errors.inputFile ? "Ce champ est requis" : ""}
        />

        <Button
          title="Vérifier les données à importer"
          onClick={() => undefined}
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
            <table className={cx(classes.table)}>
              <caption>
                Résumé de l'import à effectuer pour le groupe{" "}
                {getValues("groupName")} :{" "}
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
                        {numberOfInvalidCandidateEstablishments}{" "}
                        établissement(s) en erreur et ne seront pas importés
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
                  onClick={() =>
                    dispatch(
                      establishmentBatchSlice.actions.addEstablishmentBatchRequested(
                        {
                          groupName: getValues().groupName,
                          formEstablishments: candidateEstablishments ?? [],
                        },
                      ),
                    )
                  }
                  type="button"
                  className={fr.cx("fr-ml-1w")}
                >
                  Importer ces succursales
                </Button>
                <SubmitFeedbackNotification
                  submitFeedback={feedback}
                  messageByKind={{
                    success: "Super, ça a bien été ajouté !",
                  }}
                />
              </caption>

              <thead>
                <tr>
                  {keys(candidateEstablishments[0]).map((key) => (
                    <th scope="col" key={key}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidateEstablishments.map((establishment, index) => (
                  <tr
                    key={`${establishment.siret}-${index}`}
                    style={{
                      backgroundColor: establishment.zodErrors.length
                        ? "red"
                        : "",
                    }}
                  >
                    {values(establishment).map((value, index) => (
                      <td
                        key={`${establishment.siret}-value-${index}`}
                        className={fr.cx("fr-text--xs")}
                      >
                        {value ? JSON.stringify(value) : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const useStyles = makeStyles<{
  tableWrapper: {
    background: string;
  };
  table: {
    maxHeight: "90vh" | "0";
    overflow: "auto" | "hidden";
  };
}>()((_theme, overrides) => ({
  ...overrides,
}));
