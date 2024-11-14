import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Autocomplete } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AgencyOption } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agenciesSelectors } from "src/core-logic/domain/agencies/agencies.selectors";
import { agenciesSlice } from "src/core-logic/domain/agencies/agencies.slice";
import { useStyles } from "tss-react/dsfr";

type MultipleAgencyInputProps = {
  name?: string;
  label?: string;
  initialAgencies?: AgencyOption[];
  onAgencyAdd: (agency: AgencyOption) => void;
  onAgencyDelete: (agency: AgencyOption) => void;
  error?: string;
  id?: string;
};

const placeholderOption: AgencyOption = {
  id: "",
  name: "",
  kind: "autre",
  status: "active",
};

export const MultipleAgencyInput = ({
  name,
  label,
  initialAgencies,
  onAgencyAdd,
  onAgencyDelete,
  error,
  id = "multiple-agency-input",
}: MultipleAgencyInputProps) => {
  const { cx } = useStyles();
  const [currentAgencies, setCurrentAgencies] = useState<AgencyOption[]>(
    initialAgencies || [],
  );
  if (currentAgencies.length === 0) {
    setCurrentAgencies([placeholderOption]);
  }
  return (
    <div className={cx(fr.cx("fr-input-group"), "im-agency-autocomplete")}>
      <>
        {label && <h2 className={fr.cx("fr-text--lead")}>{label}</h2>}

        {currentAgencies.map((agency, index) => (
          <div
            className={fr.cx("fr-grid-row", "fr-grid-row--bottom")}
            key={agency.id}
          >
            <div className={fr.cx("fr-col", "fr-mt-2w")}>
              <AgencyAutocomplete
                label="Commencez à taper le nom de votre structure"
                placeholder="Ex: Agence de Berry"
                seletedAgency={currentAgencies[index]}
                id={`${id}--${index}`}
                onAgencySelected={(selectedAgency) => {
                  const updatedAgencies = [...currentAgencies];
                  updatedAgencies[index] = selectedAgency;
                  setCurrentAgencies(updatedAgencies);
                  onAgencyAdd(selectedAgency);
                }}
                excludeAgencies={currentAgencies}
              />
            </div>
            <Button
              type="button"
              iconId="fr-icon-delete-bin-line"
              title="Suppression"
              id="im-multiple-agency-input__delete-option-button"
              onClick={() => {
                const updatedAgencies = [...currentAgencies];
                updatedAgencies.splice(index, 1);
                setCurrentAgencies(updatedAgencies);
                onAgencyDelete(agency);
              }}
            />
          </div>
        ))}
      </>

      <Button
        className={fr.cx("fr-my-4v")}
        type="button"
        iconId="fr-icon-add-line"
        title="Ajouter un métier"
        priority="secondary"
        onClick={() => {
          if (currentAgencies[currentAgencies.length - 1].id !== "") {
            setCurrentAgencies([...currentAgencies, placeholderOption]);
          }
        }}
      >
        Ajouter un organisme
      </Button>

      {error?.length && (
        <div
          id={`${name}-error-description`}
          className={fr.cx("fr-error-text")}
        >
          {typeof error === "string" ? error : "Indiquez au moins 1 métier."}
        </div>
      )}
    </div>
  );
};

type AgencyAutocompleteProps = {
  label: string;
  placeholder?: string;
  seletedAgency: AgencyOption;
  onAgencySelected: (agency: AgencyOption) => void;
  excludeAgencies?: AgencyOption[];
  id: string;
};

const AgencyAutocomplete = ({
  label,
  placeholder,
  seletedAgency,
  onAgencySelected,
  excludeAgencies,
  id = "agency-autocomplete",
}: AgencyAutocompleteProps) => {
  const { cx } = useStyles();
  const [inputQuery, setInputQuery] = useState<string>("");
  const dispatch = useDispatch();
  const agencyOptions = useAppSelector(agenciesSelectors.options);

  useEffect(() => {
    if (inputQuery.length >= 3)
      dispatch(
        agenciesSlice.actions.fetchAgencyOptionsRequested({
          nameIncludes: inputQuery,
          status: ["active", "from-api-PE"],
        }),
      );
  }, [inputQuery, dispatch]);
  return (
    <Autocomplete
      disablePortal
      filterOptions={(x) => x}
      options={agencyOptions.filter(
        ({ id }) =>
          !excludeAgencies?.find((excludedAgency) => excludedAgency.id === id),
      )}
      value={seletedAgency ?? ""}
      id={id}
      getOptionLabel={(option: AgencyOption) => option.name}
      renderOption={(props, option) => <li {...props}>{option.name}</li>}
      onChange={(_, selectedAgency) => {
        if (!selectedAgency) return;
        onAgencySelected(selectedAgency);
      }}
      onInputChange={(_, value) => {
        setInputQuery(value);
      }}
      renderInput={(params) => (
        <div ref={params.InputProps.ref}>
          <Input
            className={cx("im-autocomplete-search")}
            label={label}
            nativeInputProps={{
              ...params.inputProps,
              value: params.inputProps.value?.toString(),
              placeholder,
            }}
          />
        </div>
      )}
    />
  );
};
