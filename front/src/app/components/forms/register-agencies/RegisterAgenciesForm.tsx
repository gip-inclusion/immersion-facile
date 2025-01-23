import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import SearchBar from "@codegouvfr/react-dsfr/SearchBar";
import Table from "@codegouvfr/react-dsfr/Table";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import React, { ElementRef, useState } from "react";
import { ErrorNotifications, Tag } from "react-design-system";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  AgencyId,
  AgencyOption,
  InclusionConnectedUser,
  agencyKindToLabel,
  agencyKindToLabelIncludingIF,
  agencyOptionSchema,
  domElementIds,
} from "shared";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";
import {
  displayReadableError,
  getFormContents,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agenciesSelectors } from "src/core-logic/domain/agencies/agencies.selectors";
import { agenciesSlice } from "src/core-logic/domain/agencies/agencies.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import { z } from "zod";
import { MultipleAgencyInput } from "./MultipleAgencyInput";

type WithAgenciesOptions = {
  agencies: AgencyOption[];
};

const registerAgenciesFormSchema: z.Schema<WithAgenciesOptions> = z.object({
  agencies: z.array(agencyOptionSchema).nonempty(),
});

export const RegisterAgenciesForm = ({
  currentUser,
}: { currentUser: InclusionConnectedUser }) => {
  const { handleSubmit, setValue, formState, getValues, watch } =
    useForm<WithAgenciesOptions>({
      defaultValues: {
        agencies: [],
      },
      resolver: zodResolver(registerAgenciesFormSchema),
    });
  const { getFormErrors } = getFormContents(formAgencyFieldsLabels);
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState<string>("");
  const inputElement = React.useRef<ElementRef<"input">>(null);

  const [isAllChecked, setIsAllChecked] = useState<boolean>(false);
  const [checkedAgencies, setCheckedAgencies] = useState<AgencyId[]>([]);
  return (
    <>
      <p className={fr.cx("fr-mt-4w")}>
        Bonjour {currentUser.firstName} {currentUser.lastName}, recherchez un
        organisme afin d'accéder aux conventions et statistiques de ce dernier.
        Un administrateur vérifiera et validera votre demande.
      </p>
      <div className={fr.cx("fr-mt-4w", "fr-mb-2w")}>
        <Input
          label="Rechercher un organisme"
          hintText="Par n° SIRET ou nom sous lequel il est enregistré sur Immersion Facilitée"
          nativeInputProps={{
            id: domElementIds.agencyDashboard.registerAgencies.search,
            type: "search",
            placeholder: "",
            value: inputValue,
            onChange: (event) => {
              setInputValue(event.currentTarget.value);
              setCheckedAgencies([]);
              setIsAllChecked(false);
              dispatch(
                agenciesSlice.actions.fetchAgencyOptionsRequested({
                  nameIncludes: event.currentTarget.value,
                  status: ["active", "from-api-PE"],
                }),
              );
            },
            onKeyDown: (event) => {
              if (event.key === "Escape") {
                inputElement.current?.blur();
              }
            },
          }}
        />
      </div>
      <a
        href="https://annuaire-entreprises.data.gouv.fr/"
        target="_blank"
        rel="noreferrer"
        className={fr.cx("fr-link")}
      >
        <i className={fr.cx("fr-icon-information-fill", "fr-icon--sm")} />
        Retrouver votre siret sur l'Annuaire des Entreprises
      </a>

      <div className={fr.cx("fr-mt-6w")}>
        <strong>Résultats pour votre recherche "{inputValue}"</strong>
        <p className={fr.cx("fr-hint-text")}>
          {checkedAgencies.length}{" "}
          {checkedAgencies.length <= 1
            ? "organisme sélectionné"
            : "organismes sélectionnés"}
        </p>
      </div>
      <AgencyTable
        checkedAgencies={checkedAgencies}
        setCheckedAgencies={setCheckedAgencies}
        isAllChecked={isAllChecked}
        setIsAllChecked={setIsAllChecked}
      />

      {/* <form
        onSubmit={handleSubmit((values) =>
          dispatch(
            inclusionConnectedSlice.actions.registerAgenciesRequested({
              agencies: values.agencies.map((agency) => agency.id),
              feedbackTopic: "dashboard-agency-register-user",
            }),
          ),
        )}
        id={domElementIds.agencyDashboard.registerAgencies.form}
      >
        <MultipleAgencyInput
          initialAgencies={watch("agencies")}
          label="Organisme(s) au(x)quel(s) vous êtes rattaché(s)"
          id={domElementIds.agencyDashboard.registerAgencies.agencyAutocomplete}
          onAgencyAdd={(agency) => {
            setValue("agencies", [...getValues("agencies"), agency]);
          }}
          onAgencyDelete={(agency) => {
            setValue(
              "agencies",
              getValues("agencies").filter(
                (agencyOption) => agencyOption.id !== agency.id,
              ),
            );
          }}
        />
        <ErrorNotifications
          errorsWithLabels={toErrorsWithLabels({
            errors: displayReadableError(formState.errors),
            labels: getFormErrors(),
          })}
          visible={keys(formState.errors).length > 0}
        />
        <div className={fr.cx("fr-mt-2w")}>
          <Button
            id={domElementIds.agencyDashboard.registerAgencies.submitButton}
          >
            Demander à être relié à ces structures
          </Button>
        </div>
      </form> */}
    </>
  );
};

const AgencyTable = ({
  isAllChecked,
  setIsAllChecked,
  checkedAgencies,
  setCheckedAgencies,
}: {
  isAllChecked: boolean;
  setIsAllChecked: (isAllChecked: boolean) => void;
  checkedAgencies: AgencyId[];
  setCheckedAgencies: (agencies: AgencyId[]) => void;
}) => {
  const isFetching = useAppSelector(agenciesSelectors.isLoading);
  const agencies = useAppSelector(agenciesSelectors.options);

  if (isFetching) return <p>Chargement en cours...</p>;
  if (agencies.length === 0)
    return <p>Aucun organisme correspondant à votre recherche</p>;

  return (
    <Table
      fixed
      id={domElementIds.admin.usersTab.usersTable}
      headers={[
        <Checkbox
          options={[
            {
              label: "",
              nativeInputProps: {
                checked: isAllChecked,
                onChange: (event) => {
                  const checked = event.currentTarget.checked;
                  setIsAllChecked(checked);
                  if (!checked) {
                    setCheckedAgencies([]);
                  } else {
                    setCheckedAgencies(agencies.map(({ id }) => id));
                  }
                },
              },
            },
          ]}
        />,
        "Organismes",
      ]}
      data={agencies.map((agency) => [
        <Checkbox
          options={[
            {
              label: "",
              nativeInputProps: {
                checked: checkedAgencies.includes(agency.id),
                onChange: (event) => {
                  const checked = event.currentTarget.checked;
                  if (checked) {
                    setCheckedAgencies([...checkedAgencies, agency.id]);
                  } else {
                    setCheckedAgencies(
                      checkedAgencies.filter((id) => id !== agency.id),
                    );
                  }
                },
              },
            },
          ]}
        />,
        <>
          <Tag
            theme={
              agency.refersToAgencyName
                ? "structureAccompagnement"
                : "prescripteur"
            }
            label={`${
              agency.refersToAgencyName
                ? "Structure d'accompagnement"
                : "Prescripteur"
            } - ${agencyKindToLabelIncludingIF[agency.kind]}`}
          />
          <br />
          <strong>{agency.name}</strong>
          <br />
          <p>{agency.address.streetNumberAndAddress}</p>
        </>,
      ])}
    />
  );
};
