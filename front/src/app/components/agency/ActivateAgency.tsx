import { fr } from "@codegouvfr/react-dsfr";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import React, { useEffect } from "react";
import { DsfrTitle, Select, SelectOption } from "react-design-system";
import { useDispatch } from "react-redux";
import { AgencyOption } from "shared";
import "src/assets/admin.css";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import { useAppSelector } from "../../hooks/reduxHooks";
import { AgencyDetails } from "../admin/AgencyDetails";
import { ActiveOrRejectedStatus } from "../../../core-logic/ports/AgencyGateway";

const toSelectOption = (option: AgencyOption): SelectOption => ({
  label: option.name,
  value: option.id,
});

const useFetchAgenciesNeedingReview = () => {
  const { agencyNeedingReviewOptions, agencyNeedingReview } = useAppSelector(
    agencyAdminSelectors.agencyState,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(agencyAdminSlice.actions.fetchAgenciesNeedingReviewRequested());
  }, []);

  return {
    agencyNeedingReviewOptions,
    agencyNeedingReview,
  };
};

export const ActivateAgency = () => {
  const { agencyNeedingReviewOptions, agencyNeedingReview } =
    useFetchAgenciesNeedingReview();

  const dispatch = useDispatch();

  const updateAgencyStatus = (status: ActiveOrRejectedStatus) => {
    if (!agencyNeedingReview) return;
    dispatch(
      agencyAdminSlice.actions.updateAgencyNeedingReviewStatusRequested({
        id: agencyNeedingReview.id,
        status,
      }),
    );
  };

  return (
    <>
      <DsfrTitle
        level={5}
        text="Activer ou Rejeter une agence"
        className={fr.cx("fr-mt-4w")}
      />
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
        <Select
          placeholder="Veuillez sélectionner une agence"
          label={`${agencyNeedingReviewOptions.length} agence(s) en attente de revue`}
          id={"agency-selector"}
          options={agencyNeedingReviewOptions.map(toSelectOption)}
          onChange={(event) =>
            dispatch(
              agencyAdminSlice.actions.setSelectedAgencyNeedingReviewId(
                event.currentTarget.value,
              ),
            )
          }
        />

        <AgencyDetails />
        {agencyNeedingReview?.id && (
          <ButtonsGroup
            className={fr.cx("fr-mt-4w")}
            buttonsEquisized
            alignment="center"
            inlineLayoutWhen="always"
            buttons={[
              {
                iconId: "fr-icon-checkbox-fill",
                children: "Activer cette agence",
                priority: "primary",
                onClick: () => updateAgencyStatus("active"),
              },
              {
                iconId: "fr-icon-alert-fill",
                children: "Rejeter cette agence",
                priority: "secondary",
                onClick: () => updateAgencyStatus("rejected"),
              },
            ]}
          />
        )}
      </div>
    </>
  );
};
