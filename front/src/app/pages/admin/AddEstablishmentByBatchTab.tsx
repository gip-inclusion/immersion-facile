import React, { useEffect, useRef, useState } from "react";
import { DsfrTitle } from "react-design-system";
import Papa from "papaparse";
import {
  ContactMethod,
  csvBooleanToBoolean,
  establishmentAppellationsFromCSVToDto,
  establishmentCopyEmailsFromCSVToDto,
  FormEstablishmentDto,
  formEstablishmentSchema,
  FormEstablishmentSource,
} from "shared";
import Button from "@codegouvfr/react-dsfr/Button";
import { keys, values } from "ramda";
import { makeStyles } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";

type CSVBoolean = "1" | "0" | "";
type CSVOptionalString = string | "";
type FormEstablishmentDtoWithErrors = FormEstablishmentDto & {
  zodErrors: z.ZodIssue[];
};
type EstablishmentCSVRow = {
  siret: string;
  businessNameCustomized: CSVOptionalString;
  businessName: string;
  businessAddress: string;
  naf_code: string;
  appellations_code: string;
  isEngagedEnterprise: CSVBoolean;
  businessContact_job: string;
  businessContact_email: string;
  businessContact_phone: string;
  businessContact_lastName: string;
  businessContact_firstName: string;
  businessContact_contactMethod: ContactMethod;
  businessContact_copyEmails: string;
  isSearchable: CSVBoolean;
  website: CSVOptionalString;
  additionalInformation: CSVOptionalString;
  fitForDisabledWorkers: CSVBoolean;
};
type AddEstablishmentByBatchTabForm = {
  groupName: string;
  inputFile: string;
};

export const AddEstablishmentByBatchTab = () => {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AddEstablishmentByBatchTabForm>();

  const onSubmit = (formData: AddEstablishmentByBatchTabForm) => {
    Papa.parse(formData.inputFile, papaOptions);
    setFormSubmitted(true);
  };
  const papaOptions: Papa.ParseRemoteConfig<EstablishmentCSVRow> = {
    header: true,
    complete: (papaParsedReturn: Papa.ParseResult<EstablishmentCSVRow>) =>
      setParsedReturn(papaParsedReturn),
    download: true,
  };

  const [parsedReturn, setParsedReturn] =
    useState<Papa.ParseResult<EstablishmentCSVRow> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [stagingEstablishments, setStagingEstablishments] = useState<{
    valid: number;
    invalid: number;
    establishments: FormEstablishmentDtoWithErrors[] | undefined;
  }>({
    valid: 0,
    invalid: 0,
    establishments: undefined,
  });

  const tableElement = useRef<HTMLTableElement | null>(null);
  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);
  useEffect(() => {
    const updatedStagingEstablishments = parsedReturn?.data.map(
      (
        establishmentRow: EstablishmentCSVRow,
      ): FormEstablishmentDtoWithErrors => {
        let errors: z.ZodIssue[] = [];
        const mappedEstablishment = {
          businessAddress: establishmentRow.businessAddress,
          businessName: establishmentRow.businessName,
          siret: establishmentRow.siret,
          businessNameCustomized: establishmentRow.businessNameCustomized,
          additionalInformation: establishmentRow.additionalInformation,
          naf: {
            code: establishmentRow.naf_code,
            nomenclature: "NAFRev2",
          },
          website: establishmentRow.website,
          source: "immersion-facile" as FormEstablishmentSource,
          appellations: establishmentAppellationsFromCSVToDto(
            establishmentRow.appellations_code,
          ),
          businessContact: {
            contactMethod: establishmentRow.businessContact_contactMethod,
            copyEmails: establishmentCopyEmailsFromCSVToDto(
              establishmentRow.businessContact_copyEmails,
            ),
            email: establishmentRow.businessContact_email,
            firstName: establishmentRow.businessContact_firstName,
            job: establishmentRow.businessContact_job,
            lastName: establishmentRow.businessContact_lastName,
            phone: establishmentRow.businessContact_phone,
          },
          isSearchable: csvBooleanToBoolean(establishmentRow.isSearchable),
          fitForDisabledWorkers: csvBooleanToBoolean(
            establishmentRow.fitForDisabledWorkers,
          ),
          isEngagedEnterprise: csvBooleanToBoolean(
            establishmentRow.isEngagedEnterprise,
          ),
        };
        try {
          formEstablishmentSchema.parse(mappedEstablishment);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors = error.issues;
          }
        }
        return { ...mappedEstablishment, zodErrors: errors };
      },
    );
    setStagingEstablishments({
      establishments: updatedStagingEstablishments,
      valid: updatedStagingEstablishments
        ? updatedStagingEstablishments.filter(
            (establishment) => establishment.zodErrors.length === 0,
          ).length
        : 0,
      invalid: updatedStagingEstablishments
        ? updatedStagingEstablishments.filter(
            (establishment) => establishment.zodErrors.length,
          ).length
        : 0,
    });
  }, [parsedReturn]);
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
            onChange: (event) => {
              const reader = new FileReader();
              if (event.target.files?.length) {
                const file = event.target.files[0];
                reader.onload = function () {
                  const rawCsvUrl = reader.result as string;
                  setValue("inputFile", rawCsvUrl);
                };
                reader.readAsDataURL(file);
              }
            },
            accept: ".csv",
          }}
          state={errors.groupName ? "error" : "default"}
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

      {stagingEstablishments.establishments &&
        !!stagingEstablishments.establishments.length && (
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
                    {!!stagingEstablishments.valid && (
                      <li>
                        <span className={fr.cx("fr-valid-text")}>
                          {stagingEstablishments.valid} établissement(s) prêts à
                          être importés
                        </span>
                      </li>
                    )}
                    {!!stagingEstablishments.invalid && (
                      <li>
                        <span className={fr.cx("fr-error-text")}>
                          {stagingEstablishments.invalid} établissement(s) en
                          erreur et ne seront pas importés
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
                    onClick={() => alert("Todo import")}
                    type="button"
                    className={fr.cx("fr-ml-1w")}
                  >
                    Importer ces succursales
                  </Button>
                </caption>

                <thead>
                  <tr>
                    {keys(stagingEstablishments.establishments[0]).map(
                      (key) => (
                        <th scope="col" key={key}>
                          {key}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {stagingEstablishments.establishments.map(
                    (establishment, index) => (
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
                    ),
                  )}
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
