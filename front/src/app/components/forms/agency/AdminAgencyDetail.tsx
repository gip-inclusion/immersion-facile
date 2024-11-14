import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React, { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { SubmitFeedbackNotification } from "src/app/components/SubmitFeedbackNotification";
import { AgencyStatusBadge } from "src/app/components/agency/AgencyStatusBadge";
import { agencyAdminSubmitMessageByKind } from "src/app/components/agency/AgencySubmitFeedback";
import { AgencyTag } from "src/app/components/agency/AgencyTag";
import { AgencyUsers } from "src/app/components/agency/AgencyUsers";
import { EditAgencyForm } from "src/app/components/forms/agency/EditAgencyForm";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { routes } from "src/app/routes/routes";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { icUsersAdminSlice } from "src/core-logic/domain/admin/icUsersAdmin/icUsersAdmin.slice";
import { Route } from "type-route";

type AdminAgencyDetailProps = {
  route: Route<typeof routes.adminAgencyDetail>;
};

export const AdminAgencyDetail = ({ route }: AdminAgencyDetailProps) => {
  const feedback = useAppSelector(agencyAdminSelectors.feedback);
  const agency = useAppSelector(agencyAdminSelectors.agency);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      agencyAdminSlice.actions.setSelectedAgencyId(route.params.agencyId),
    );
    dispatch(
      icUsersAdminSlice.actions.fetchAgencyUsersRequested({
        agencyId: route.params.agencyId,
      }),
    );
    return () => {
      dispatch(agencyAdminSlice.actions.setAgency(null));
    };
  }, [dispatch, route.params.agencyId]);

  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton("Copier");

  if (!agency) return <Loader />;

  return (
    <div>
      <h1 className={fr.cx("fr-h1")}>{agency.name}</h1>
      <div>
        Id de l'agence : <Badge severity="success">{agency.id}</Badge>{" "}
        <Button
          type="button"
          disabled={copyButtonIsDisabled}
          iconId={"fr-icon-clipboard-fill"}
          onClick={() => onCopyButtonClick(agency.id)}
        >
          {copyButtonLabel}
        </Button>
      </div>
      <SubmitFeedbackNotification
        submitFeedback={feedback}
        messageByKind={agencyAdminSubmitMessageByKind}
      />
      {agency && (
        <>
          <AgencyTag
            refersToAgencyName={agency.refersToAgencyName}
            className={fr.cx("fr-my-2w")}
          />
          <AgencyStatusBadge status={agency.status} />
          <EditAgencyForm agency={agency} />
        </>
      )}
      {agency && <AgencyUsers agency={agency} />}
    </div>
  );
};
