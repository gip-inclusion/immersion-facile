import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import Table from "@codegouvfr/react-dsfr/Table";
import React, { ElementRef, useState } from "react";
import { Tag } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  AgencyId,
  InclusionConnectedUser,
  agencyKindToLabelIncludingIF,
  domElementIds,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { agenciesSelectors } from "src/core-logic/domain/agencies/agencies.selectors";
import { agenciesSlice } from "src/core-logic/domain/agencies/agencies.slice";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";

export const RegisterAgenciesForm = ({
  currentUser,
}: {
  currentUser: InclusionConnectedUser;
}) => {
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState<string>("");
  const inputElement = React.useRef<ElementRef<"input">>(null);

  const [isAllChecked, setIsAllChecked] = useState<boolean>(false);
  const [checkedAgencies, setCheckedAgencies] = useState<AgencyId[]>([]);
  return (
    <>
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

      {inputValue.length > 0 && (
        <>
          <section className={fr.cx("fr-mt-6w")}>
            <div className={fr.cx("fr-grid-row")}>
              <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
                <strong>Résultats pour votre recherche "{inputValue}"</strong>
                <p className={fr.cx("fr-hint-text")}>
                  {checkedAgencies.length}{" "}
                  {checkedAgencies.length <= 1
                    ? "organisme sélectionné"
                    : "organismes sélectionnés"}
                </p>
              </div>
              <Button
                className={fr.cx("fr-col-12", "fr-col-md-4")}
                id={domElementIds.agencyDashboard.registerAgencies.submitButton}
                onClick={() => {
                  dispatch(
                    inclusionConnectedSlice.actions.registerAgenciesRequested({
                      agencies: checkedAgencies,
                      feedbackTopic: "dashboard-agency-register-user",
                    }),
                  );
                }}
                disabled={checkedAgencies.length === 0}
              >
                Demander l'accès aux organismes sélectionnés
              </Button>
            </div>
            <AgencyTable
              checkedAgencies={checkedAgencies}
              setCheckedAgencies={setCheckedAgencies}
              isAllChecked={isAllChecked}
              setIsAllChecked={setIsAllChecked}
              currentUser={currentUser}
            />
          </section>
          <section>
            <h2 className={fr.cx("fr-text--lead")}>
              Vous ne trouvez pas votre organisme ?
            </h2>
            <Button
              linkProps={{
                href: `${routes.addAgency().href}`,
              }}
            >
              Créer un nouvel organisme sur Immersion Facilitée
            </Button>
          </section>
        </>
      )}
    </>
  );
};

const AgencyTable = ({
  isAllChecked,
  setIsAllChecked,
  checkedAgencies,
  setCheckedAgencies,
  currentUser,
}: {
  isAllChecked: boolean;
  setIsAllChecked: (isAllChecked: boolean) => void;
  checkedAgencies: AgencyId[];
  setCheckedAgencies: (agencies: AgencyId[]) => void;
  currentUser: InclusionConnectedUser;
}) => {
  const isFetching = useAppSelector(agenciesSelectors.isLoading);
  const userAgencyIds = currentUser.agencyRights.map(
    (agencyRight) => agencyRight.agency.id,
  );
  const agencies = useAppSelector(agenciesSelectors.options).filter(
    (agency) => !userAgencyIds.includes(agency.id),
  );

  if (isFetching) return <p>Chargement en cours...</p>;
  if (agencies.length === 0)
    return <p>Aucun organisme correspondant à votre recherche</p>;

  return (
    <Table
      fixed
      id={domElementIds.agencyDashboard.registerAgencies.table}
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
