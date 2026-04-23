import { Badge, type BadgeProps } from "@codegouvfr/react-dsfr/Badge";
import {
  type DiscussionDisplayStatus,
  type DiscussionInList,
  type DiscussionReadDto,
  discussionToExchangesData,
  domElementIds,
  type ExchangeRole,
  getDiscussionDisplayStatus,
  isDiscussionInList,
} from "shared";

export const DiscussionStatusBadge = ({
  discussion,
  viewer,
  id = domElementIds.establishmentDashboard.discussion.statusBadge,
  small = false,
}: {
  discussion: DiscussionReadDto | DiscussionInList;
  viewer: ExchangeRole;
  id?: string;
  small?: BadgeProps["small"];
}) => {
  const statusBadge =
    statusBadgeData[viewer][
      getDiscussionDisplayStatus({
        discussion: {
          createdAt: discussion.createdAt,
          status: discussion.status,
          exchangesData: isDiscussionInList(discussion)
            ? discussion.exchangesData
            : discussionToExchangesData(discussion),
        },
        now: new Date(),
        viewer,
      })
    ];
  return (
    <Badge id={id} severity={statusBadge.severity} small={small}>
      {statusBadge.label}
    </Badge>
  );
};

const statusBadgeData: Record<
  ExchangeRole,
  Record<
    DiscussionDisplayStatus,
    {
      severity: BadgeProps["severity"];
      label: string;
    }
  >
> = {
  establishment: {
    new: {
      severity: "info",
      label: "En cours - Nouveau",
    },
    "needs-answer": {
      severity: "warning",
      label: "En cours - À répondre",
    },
    "needs-urgent-answer": {
      severity: "error",
      label: "En cours - Urgent",
    },
    answered: {
      severity: "new",
      label: "En cours - Répondu",
    },
    accepted: {
      severity: "success",
      label: "Acceptée",
    },
    rejected: {
      severity: undefined,
      label: "Refusée",
    },
  },
  potentialBeneficiary: {
    new: {
      severity: "info",
      label: "Envoyée",
    },
    "needs-answer": {
      severity: "warning",
      label: "En cours - À répondre",
    },
    "needs-urgent-answer": {
      severity: "error",
      label: "En cours - Urgent",
    },
    answered: {
      severity: "new",
      label: "En cours - Répondu",
    },
    accepted: {
      severity: "success",
      label: "Acceptée",
    },
    rejected: {
      severity: undefined,
      label: "Refusée",
    },
  },
};
