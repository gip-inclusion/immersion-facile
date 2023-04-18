import React, { useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Autocomplete } from "@mui/material";
import { useStyles } from "tss-react/dsfr";
import { AgencyOption } from "shared";
import { agencyGateway } from "src/config/dependencies";

type MultipleAgencyInputProps = {
  name?: string;
  label?: string;
  initialAgencies?: AgencyOption[];
  onAgencyAdd: (agency: AgencyOption) => void;
  onAgencyDelete: (agency: AgencyOption) => void;
  error?: string;
};

const placeholderOption: AgencyOption = {
  id: "",
  name: "",
};

export const MultipleAgencyInput = ({
  name,
  label,
  initialAgencies,
  onAgencyAdd,
  onAgencyDelete,
  error,
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
                label="Commencez à taper le nom de votre organisme"
                placeholder="Ex: Agence de Berry"
                seletedAgency={currentAgencies[index]}
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

      {error && error.length && (
        <div
          id={name + "-error-description"}
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
};

const AgencyAutocomplete = ({
  label,
  placeholder,
  seletedAgency,
  onAgencySelected,
  excludeAgencies,
}: AgencyAutocompleteProps) => {
  const { cx } = useStyles();
  const [agencyOptions, setAgencyOptions] = useState<AgencyOption[]>([]);
  const [inputQuery, setInputQuery] = useState<string>("");

  useEffect(() => {
    if (inputQuery === "") return;
    if (inputQuery.length < 3) return;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    agencyGateway
      .getFilteredAgencies({
        nameIncludes: inputQuery,
        status: ["active", "from-api-PE"],
      })
      .then((agencies) => {
        setAgencyOptions(
          agencies.filter(
            (agency) =>
              !excludeAgencies?.find(
                (excludedAgency) => excludedAgency.id === agency.id,
              ),
          ),
        );
      });
  }, [inputQuery]);
  return (
    <Autocomplete
      disablePortal
      filterOptions={(x) => x}
      options={agencyOptions}
      value={seletedAgency ?? ""}
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
