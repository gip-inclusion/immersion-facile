import type { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { connectedUsersAdminSlice } from "src/core-logic/domain/admin/connectedUsersAdmin/connectedUsersAdmin.slice";
import { createUserOnAgencySlice } from "src/core-logic/domain/agencies/create-user-on-agency/createUserOnAgency.slice";
import { fetchAgencySlice } from "src/core-logic/domain/agencies/fetch-agency/fetchAgency.slice";
import { removeUserFromAgencySlice } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.slice";
import { updateAgencySlice } from "src/core-logic/domain/agencies/update-agency/updateAgency.slice";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { assessmentSlice } from "src/core-logic/domain/assessment/assessment.slice";
import { sendAssessmentLinkSlice } from "src/core-logic/domain/assessment/send-assessment-link/sendAssessmentLink.slice";
import { connectedUserSlice } from "src/core-logic/domain/connected-user/connectedUser.slice";
import { conventionListSlice } from "src/core-logic/domain/connected-user/conventionList/connectedUserConventionList.slice";
import { connectedUserConventionsToManageSlice } from "src/core-logic/domain/connected-user/conventionsToManage/connectedUserConventionsToManage.slice";
import { conventionsWithBroadcastFeedbackSlice } from "src/core-logic/domain/connected-user/conventionsWithBroadcastFeedback/conventionsWithBroadcastFeedback.slice";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { conventionActionSlice } from "src/core-logic/domain/convention/convention-action/conventionAction.slice";
import { conventionDraftSlice } from "src/core-logic/domain/convention/convention-draft/conventionDraft.slice";
import { sendSignatureLinkSlice } from "src/core-logic/domain/convention/send-signature-link/sendSignatureLink.slice";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";
import { establishmentBatchSlice } from "src/core-logic/domain/establishmentBatch/establishmentBatch.slice";
import type {
  ActionKindAndLevel,
  Feedback,
} from "src/core-logic/domain/feedback/feedback.slice";
import { partnersErroredConventionSlice } from "src/core-logic/domain/partnersErroredConvention/partnersErroredConvention.slice";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import { authSlice } from "../auth/auth.slice";

type FeedbackWithActionName = {
  action: ActionCreatorWithPayload<any, string>;
  title: Feedback["title"];
  message: Feedback["message"];
};

const topics = [
  "agency-for-dashboard",
  "agency-user-for-dashboard",
  "agency-user",
  "api-consumer-global",
  "api-consumer-names",
  "api-consumer-renew",
  "api-consumer-revoke",
  "assessment",
  "auth-global",
  "broadcast-convention-again",
  "connected-user-conventions",
  "connected-user-conventionList",
  "convention-action-accept-by-counsellor",
  "convention-action-accept-by-validator",
  "convention-action-cancel",
  "convention-action-deprecate",
  "convention-action-edit",
  "convention-action-edit-counsellor-name",
  "convention-action-reject",
  "convention-action-renew",
  "convention-action-sign",
  "convention-draft",
  "convention-form",
  "convention-status-dashboard",
  "conventions-with-broadcast-feedback",
  "dashboard-agency-register-user",
  "dashboard-discussion-status-updated",
  "dashboard-discussion",
  "establishment-dashboard-users-rights",
  "establishment-dashboard-discussion-send-message",
  "establishment-dashboard-discussion-list",
  "establishments-batch",
  "form-establishment",
  "form-establishment-offer-modal",
  "login-by-email",
  "magic-link-interstitial",
  "partner-conventions",
  "search-result",
  "send-signature-link",
  "send-assessment-link",
  "siret-input",
  "transfer-convention-to-agency",
  "unused",
  "user",
] as const;

export type FeedbackTopic = (typeof topics)[number];

export const feedbacks: Record<
  FeedbackTopic,
  Partial<Partial<Record<ActionKindAndLevel, FeedbackWithActionName>>>
> = {
  "auth-global": {
    "delete.error": {
      action: authSlice.actions.fetchLogoutUrlFailed,
      title: "Une erreur est survenue lors de la déconnexion",
      message: "Vous n'avez pas pu vous déconnecter.",
    },
  },
  "api-consumer-global": {
    "create.success": {
      action: apiConsumerSlice.actions.saveApiConsumerSucceeded,
      title: "Le consommateur d'API a bien été créé",
      message:
        "Le consommateur d'API a bien été créé, il peut commencer à utiliser l'api",
    },
    "create.error": {
      action: apiConsumerSlice.actions.saveApiConsumerFailed,
      title: "Problème lors de la création du consommateur d'API",
      message:
        "Une erreur est survenue lors de la création du consommateur d'API",
    },
    "update.success": {
      action: apiConsumerSlice.actions.updateApiConsumerSucceeded,
      title: "Le consommateur d'API a bien été mis à jour",
      message:
        "Le consommateur d'API a bien été mis à jour, il peut continuer à utiliser l'api",
    },
  },
  "broadcast-convention-again": {
    "create.success": {
      action:
        conventionActionSlice.actions.broadcastConventionToPartnerSucceeded,
      title: "La convention a bien été rediffusée",
      message:
        "La convention a bien été rediffusée au partenaire. Vous pouvez vous rapprocher du partenaire pour le vérifier.",
    },
    "create.info": {
      action:
        conventionActionSlice.actions.broadcastConventionToPartnerRequested,
      title: "La convention est en cours de rediffusion",
      message:
        "La convention est en cours de rediffusion au partenaire. Cela peut prendre une quinzaine de secondes.",
    },
    "create.error": {
      action: conventionActionSlice.actions.broadcastConventionToPartnerFailed,
      title: "Problème rencontré lors de la rediffusion au partenaire",
      message:
        "Une erreur est survenue. Veuillez consulter le tableau de bord.",
    },
  },
  "send-signature-link": {
    "create.success": {
      action: sendSignatureLinkSlice.actions.sendSignatureLinkSucceeded,
      title: "Le SMS a bien été envoyé",
      message:
        "Le destinataire devrait le recevoir dans les prochaines minutes.",
    },
    "create.info": {
      action: sendSignatureLinkSlice.actions.sendSignatureLinkRequested,
      title: "Le sms est en cours d'envoi",
      message:
        "Le sms est en cours d'envoi au signataire. Cela peut prendre une quinzaine de secondes.",
    },
    "create.error": {
      action: sendSignatureLinkSlice.actions.sendSignatureLinkFailed,
      title: "Problème lors de l'envoi SMS",
      message: "Une erreur est survenue lors de l'envoi du SMS.",
    },
  },
  "send-assessment-link": {
    "create.success": {
      action: sendAssessmentLinkSlice.actions.sendAssessmentLinkSucceeded,
      title: "Le SMS a bien été envoyé",
      message:
        "Le destinataire devrait le recevoir dans les prochaines minutes.",
    },
    "create.info": {
      action: sendAssessmentLinkSlice.actions.sendAssessmentLinkRequested,
      title: "Le sms est en cours d'envoi",
      message:
        "Le sms est en cours d'envoi au signataire. Cela peut prendre une quinzaine de secondes.",
    },
    "create.error": {
      action: sendAssessmentLinkSlice.actions.sendAssessmentLinkFailed,
      title: "Problème lors de l'envoi SMS",
      message: "Une erreur est survenue lors de l'envoi du SMS.",
    },
  },
  "dashboard-discussion-status-updated": {
    "update.success": {
      action: discussionSlice.actions.updateDiscussionStatusSucceeded,
      title: "La candidature a bien été mise à jour",
      message: "La candidature a bien été mise à jour",
    },
    "update.error": {
      action: discussionSlice.actions.updateDiscussionStatusFailed,
      title: "Problème lors de la mise à jour de la candidature",
      message:
        "Une erreur est survenue lors de la mise à jour de la candidature",
    },
  },
  "dashboard-discussion": {
    "fetch.success": {
      action: discussionSlice.actions.fetchDiscussionSucceeded,
      title: "Les discussions ont bien été récupérées",
      message: "Les discussions ont bien été récupérées",
    },
    "fetch.error": {
      action: discussionSlice.actions.fetchDiscussionFailed,
      title: "Problème lors de la récupération des discussions",
      message:
        "Une erreur est survenue lors de la récupération des discussions",
    },
  },
  "partner-conventions": {
    "update.success": {
      action: partnersErroredConventionSlice.actions.markAsHandledSucceeded,
      title: "La convention a bien été marquée comme traitée",
      message: "La convention a bien été marquée comme traitée.",
    },
    "update.error": {
      action: partnersErroredConventionSlice.actions.markAsHandledFailed,
      title: "Problème rencontré",
      message:
        "Problème rencontré lors du marquage de la convention comme traitée.",
    },
  },
  "api-consumer-names": {
    "fetch.error": {
      action: apiConsumerSlice.actions.fetchApiConsumerNamesFailed,
      title: "Problème rencontré",
      message:
        "Une erreur est survenue lors de la récupération de la liste des partenaires à qui rediffuser la convention",
    },
  },
  "api-consumer-revoke": {
    "create.success": {
      action: apiConsumerSlice.actions.revokeApiConsumerSucceeded,
      title: "Le consommateur d'API a bien été révoqué",
      message:
        "Le consommateur d'API a été révoqué et ne peut plus utiliser l'API",
    },
    "create.error": {
      action: apiConsumerSlice.actions.revokeApiConsumerFailed,
      title: "Problème lors de la révocation du consommateur d'API",
      message:
        "Une erreur est survenue lors de la révocation du consommateur d'API",
    },
  },
  "api-consumer-renew": {
    "create.success": {
      action: apiConsumerSlice.actions.renewApiConsumerKeySucceeded,
      title: "La clé API a bien été renouvelée",
      message:
        "La nouvelle clé API a été générée. L'ancienne clé est désormais invalide.",
    },
    "create.error": {
      action: apiConsumerSlice.actions.renewApiConsumerKeyFailed,
      title: "Problème lors du renouvellement de la clé API",
      message: "Une erreur est survenue lors du renouvellement de la clé API",
    },
  },
  "agency-user": {
    "update.success": {
      action: connectedUsersAdminSlice.actions.updateUserOnAgencySucceeded,
      title: "L'utilisateur a été mis à jour",
      message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
    },
    "update.error": {
      action: connectedUsersAdminSlice.actions.updateUserOnAgencyFailed,
      title: "Problème lors de la mise à jour de l'utilisateur",
      message:
        "Une erreur est survenue lors de la mise à jour de l'utilisateur",
    },
    "create.success": {
      action: connectedUsersAdminSlice.actions.createUserOnAgencySucceeded,
      title: "L'utilisateur a été créé",
      message: "L'utilisateur a été créé et associé à cette agence.",
    },
    "create.error": {
      action: connectedUsersAdminSlice.actions.createUserOnAgencyFailed,
      title: "Problème lors de la création de l'utilisateur",
      message: "Une erreur est survenue lors de la création de l'utilisateur",
    },
    "delete.success": {
      action: connectedUsersAdminSlice.actions.removeUserFromAgencySucceeded,
      title: "L'utilisateur n'est plus rattaché à cette agence",
      message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
    },
    "delete.error": {
      action: connectedUsersAdminSlice.actions.removeUserFromAgencyFailed,
      title:
        "Problème lors de la suppression du rattachement l'utilisateur à cette agence",
      message:
        "Une erreur est survenue lors de la suppression du rattachement de l'utilisateur.",
    },
  },
  "dashboard-agency-register-user": {
    "fetch.error": {
      action: connectedUserSlice.actions.currentUserFetchFailed,
      title: "Erreur",
      message: "Erreur lors de la récupération des infos de l'utilisateur",
    },
    "create.success": {
      action: connectedUserSlice.actions.registerAgenciesSucceeded,
      title: "Votre demande de rattachement a bien été prise en compte",
      message:
        "Elle sera étudiée prochainement par un administrateur et vous serez informé de sa décision.",
    },
    "create.error": {
      action: connectedUserSlice.actions.registerAgenciesFailed,
      title: "Erreur lors de la demande de rattachement à une agence",
      message: "Une erreur est survenue lors du rattachement de l'utilisateur",
    },
    "delete.success": {
      action: removeUserFromAgencySlice.actions.removeUserFromAgencySucceeded,
      title: "La demande d’accès a bien été annulée.",
      message: "L’administrateur de l’organisme ne la verra plus.",
    },
    "delete.error": {
      action: removeUserFromAgencySlice.actions.removeUserFromAgencyFailed,
      title:
        "Problème lors de l'annulation de la demande d’accès de l'utilisateur à cette agence",
      message:
        "Une erreur est survenue lors de l'annulation de la demande d'accès de l'utilisateur.",
    },
  },
  "agency-user-for-dashboard": {
    "fetch.error": {
      action: fetchAgencySlice.actions.fetchAgencyUsersFailed,
      title:
        "Problème rencontré lors de la récupération de la liste des utilisateurs",
      message:
        "Une erreur est survenue lors de la récupération de la liste des utilisateurs de cette agence",
    },
    "update.success": {
      action: updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded,
      title: "L'utilisateur a été mis à jour",
      message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
    },
    "update.error": {
      action: updateUserOnAgencySlice.actions.updateUserAgencyRightFailed,
      title: "Problème lors de la mise à jour de l'utilisateur",
      message:
        "Une erreur est survenue lors de la mise à jour de l'utilisateur",
    },
    "create.success": {
      action: createUserOnAgencySlice.actions.createUserOnAgencySucceeded,
      title: "L'utilisateur a été créé",
      message: "L'utilisateur a été créé et associé à cette agence.",
    },
    "create.error": {
      action: createUserOnAgencySlice.actions.createUserOnAgencyFailed,
      title: "Problème lors de la création de l'utilisateur",
      message: "Une erreur est survenue lors de la création de l'utilisateur",
    },
    "delete.success": {
      action: removeUserFromAgencySlice.actions.removeUserFromAgencySucceeded,
      title: "L'utilisateur n'est plus rattaché à cette agence",
      message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
    },
    "delete.error": {
      action: removeUserFromAgencySlice.actions.removeUserFromAgencyFailed,
      title:
        "Problème lors de la suppression du rattachement l'utilisateur à cette agence",
      message:
        "Une erreur est survenue lors de la suppression du rattachement de l'utilisateur.",
    },
  },
  "agency-for-dashboard": {
    "fetch.error": {
      action: fetchAgencySlice.actions.fetchAgencyFailed,
      title:
        "Problème rencontré lors de la récupération des données de l'agence",
      message:
        "Une erreur est survenue lors de la récupération des données de cette agence",
    },
    "update.success": {
      action: updateAgencySlice.actions.updateAgencySucceeded,
      title: "L'agence a été mis à jour",
      message: "Les données de l'agence ont été mises à jour.",
    },
    "update.error": {
      action: updateAgencySlice.actions.updateAgencyFailed,
      title: "Problème lors de la mise à jour de l'agence",
      message: "Une erreur est survenue lors de la mise à jour de l'agence",
    },
  },
  "establishments-batch": {
    "create.success": {
      action: establishmentBatchSlice.actions.addEstablishmentBatchSucceeded,
      title: "Le groupe d'entreprises a bien été créé",
      message: "L'import en masse a réussi, voici le détail :",
    },
  },
  user: {
    "update.success": {
      action: updateUserOnAgencySlice.actions.updateUserAgencyRightSucceeded,
      title: "L'utilisateur a été mis à jour",
      message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
    },
    "update.error": {
      action: updateUserOnAgencySlice.actions.updateUserAgencyRightFailed,
      title: "Problème lors de la mise à jour de l'utilisateur",
      message:
        "Une erreur est survenue lors de la mise à jour de l'utilisateur",
    },
    "delete.success": {
      action: removeUserFromAgencySlice.actions.removeUserFromAgencySucceeded,
      title: "La demande d’accès a bien été annulée.",
      message: "L’administrateur de l’organisme ne la verra plus.",
    },
    "delete.error": {
      action: removeUserFromAgencySlice.actions.removeUserFromAgencyFailed,
      title:
        "Problème lors de l'annulation de la demande d’accès de l'utilisateur à cette agence",
      message:
        "Une erreur est survenue lors de l'annulation de la demande d'accès de l'utilisateur.",
    },
  },
  "search-result": {
    "fetch.error": {
      action: searchSlice.actions.fetchSearchResultFailed,
      title: "Oups !",
      message:
        "L'offre ne peut plus être affichée, veuillez relancer une recherche d'offre d'immersion pour retrouver une offre.",
    },
  },
  "form-establishment": {
    "fetch.error": {
      action: establishmentSlice.actions.fetchEstablishmentFailed,
      title: "Problème lors de la recuperation des données de l'entreprise",
      message:
        "Une erreur est survenue lors de la recuperation des données de l'entreprise",
    },
    "create.success": {
      action: establishmentSlice.actions.createEstablishmentSucceeded,
      title: "L'entreprise a bien été créée",
      message: "L'entreprise a bien été ajoutée à notre annuaire.",
    },
    "create.error": {
      action: establishmentSlice.actions.createEstablishmentFailed,
      title: "Problème lors de la création de l'entreprise",
      message: "Une erreur est survenue lors de la création de l'entreprise",
    },
    "update.error": {
      action: establishmentSlice.actions.updateEstablishmentFailed,
      title: "Problème lors de la mise à jour de l'entreprise",
      message: "Une erreur est survenue lors de la mise à jour de l'entreprise",
    },
    "update.success": {
      action: establishmentSlice.actions.updateEstablishmentSucceeded,
      title: "L'entreprise a bien été mise à jour",
      message: "L'entreprise a bien été mise à jour",
    },
    "delete.error": {
      action: establishmentSlice.actions.deleteEstablishmentFailed,
      title: "Problème lors de la suppression de l'entreprise",
      message: "Une erreur est survenue lors de la suppression de l'entreprise",
    },
    "delete.success": {
      action: establishmentSlice.actions.deleteEstablishmentSucceeded,
      title: "L'entreprise a bien été supprimée",
      message: "L'entreprise a bien été supprimée",
    },
  },
  "form-establishment-offer-modal": {},
  "siret-input": {},
  assessment: {
    "create.success": {
      action: assessmentSlice.actions.creationSucceeded,
      title: "Bilan envoyé",
      message: "Le bilan a bien été envoyé",
    },
    "create.error": {
      action: assessmentSlice.actions.creationFailed,
      title: "Problème lors de l'envoi du bilan",
      message: "Une erreur est survenue lors de l'envoi du bilan",
    },
    "fetch.error": {
      action: assessmentSlice.actions.getAssessmentFailed,
      title: "Problème lors de la récupération du bilan",
      message: "Un problème est survenu lors de la récupération du bilan",
    },
  },
  "transfer-convention-to-agency": {
    "update.success": {
      action: conventionActionSlice.actions.transferConventionToAgencySucceeded,
      title: "La convention a bien été transférée",
      message: "La convention a bien été transférée au nouvel organisme",
    },
    "update.error": {
      action: conventionActionSlice.actions.transferConventionToAgencyFailed,
      title: "Problème lors du transfert de la convention",
      message: "Une erreur est survenue lors du transfert de la convention",
    },
  },
  "convention-action-cancel": {
    "update.success": {
      action: conventionActionSlice.actions.cancelConventionSucceeded,
      title: "La convention a bien été annulée",
      message: "La convention a bien été annulée",
    },
    "update.error": {
      action: conventionActionSlice.actions.cancelConventionFailed,
      title: "Problème lors de l'annulation de la convention",
      message: "Une erreur est survenue lors de l'annulation de la convention",
    },
  },
  "convention-action-edit-counsellor-name": {
    "update.success": {
      action: conventionActionSlice.actions.editCounsellorNameSucceeded,
      title: "Le nom du conseiller a bien été modifié",
      message: "Le nom du conseiller a bien été modifié",
    },
    "update.error": {
      action: conventionActionSlice.actions.editCounsellorNameFailed,
      title: "Problème lors de la modification du nom du conseiller",
      message:
        "Une erreur est survenue lors de la modification du nom du conseiller",
    },
  },
  "convention-action-deprecate": {
    "update.success": {
      action: conventionActionSlice.actions.deprecateConventionSucceeded,
      title: "La convention a bien été supprimée",
      message:
        "La confirmation de cette suppression va être communiquée par mail à chacun des signataires.",
    },
    "update.error": {
      action: conventionActionSlice.actions.deprecateConventionFailed,
      title: "Problème lors de la suppression de la convention",
      message:
        "Une erreur est survenue lors de la suppression de la convention",
    },
  },
  "convention-action-reject": {
    "update.success": {
      action: conventionActionSlice.actions.rejectConventionSucceeded,
      title: "La convention a bien été refusée",
      message:
        "La décision de refuser cette immersion est bien enregistrée. Cette décision va être communiquée par mail au bénéficiaire et à l'entreprise.",
    },
    "update.error": {
      action: conventionActionSlice.actions.rejectConventionFailed,
      title: "Problème lors du refus de la convention",
      message: "Une erreur est survenue lors du refus de la convention",
    },
  },
  "convention-action-edit": {
    "update.success": {
      action: conventionSlice.actions.updateConventionSucceeded,
      title: "La convention a bien été mise à jour",
      message:
        "Les signataires ont reçu un email leur demandant de signer la version modifiée.",
    },
    "update.error": {
      action: conventionSlice.actions.updateConventionFailed,
      title: "Problème lors de la mise à jour de la convention",
      message:
        "Une erreur est survenue lors de la mise à jour de la convention",
    },
  },
  "convention-action-accept-by-validator": {
    "update.success": {
      action: conventionActionSlice.actions.acceptByValidatorSucceeded,
      title: "La convention a bien été validée",
      message:
        "La validation de cette demande est bien enregistrée. La confirmation de cette validation va être communiquée par mail à chacun des signataires.",
    },
    "update.error": {
      action: conventionActionSlice.actions.acceptByValidatorFailed,
      title: "Problème lors de la validation de la convention",
      message: "Une erreur est survenue lors de la validation de la convention",
    },
  },
  "convention-action-accept-by-counsellor": {
    "update.success": {
      action: conventionActionSlice.actions.acceptByCounsellorSucceeded,
      title: "La convention a bien été marquée comme éligible",
      message:
        "Une notification est envoyée au responsable des validations pour qu'elle/il confirme ou non la validation de cette demande et initie la convention.",
    },
    "update.error": {
      action: conventionActionSlice.actions.acceptByCounsellorFailed,
      title: "Problème lors de la pré-validation de la convention",
      message:
        "Une erreur est survenue lors de la pré-validation de la convention",
    },
  },
  "convention-action-sign": {
    "update.success": {
      action: conventionActionSlice.actions.signConventionSucceeded,
      title: "La convention a bien été signée",
      message: "La convention a bien été signée",
    },
    "update.error": {
      action: conventionActionSlice.actions.signConventionFailed,
      title: "Problème lors de la signature de la convention",
      message: "Une erreur est survenue lors de la signature de la convention",
    },
  },
  "convention-action-renew": {
    "update.success": {
      action: conventionActionSlice.actions.renewConventionSucceeded,
      title: "La demande de renouvellement est bien enregistrée.",
      message:
        "Elle vient d'être envoyée à toutes les parties pour signature avant votre validation définitive.",
    },
    "update.error": {
      action: conventionActionSlice.actions.renewConventionFailed,
      title: "Problème lors du renouvellement de la convention",
      message:
        "Une erreur est survenue lors du renouvellement de la convention",
    },
  },
  "convention-status-dashboard": {
    "fetch.error": {
      action: conventionSlice.actions.conventionStatusDashboardFailed,
      title:
        "Problème lors de la récupération du tableau de bord de la convention",
      message:
        "Une erreur est survenue lors de la récupération du tableau de bord de la convention",
    },
  },
  "convention-draft": {
    "create.success": {
      action: conventionDraftSlice.actions.shareConventionDraftByEmailSucceeded,
      title: "Partager ou enregistrer un brouillon",
      message: "Cette demande de convention a bien été partagée par mail.",
    },
    "create.error": {
      action: conventionDraftSlice.actions.shareConventionDraftByEmailFailed,
      title: "Partager ou enregistrer un brouillon",
      message: "Erreur lors de l'envoi de l'email",
    },
    "fetch.error": {
      action: conventionDraftSlice.actions.fetchConventionDraftFailed,
      title: "Problème lors de la récupération du brouillon de convention",
      message:
        "Une erreur est survenue lors de la récupération du brouillon de convention",
    },
  },
  "convention-form": {
    "create.success": {
      action: conventionSlice.actions.createConventionSucceeded,
      title: "La convention a bien été créée",
      message: "La convention a bien été créée",
    },
    "create.error": {
      action: conventionSlice.actions.createConventionFailed,
      title: "Problème lors de la création de la convention",
      message: "Une erreur est survenue lors de la création de la convention",
    },
    "update.success": {
      action: conventionSlice.actions.updateConventionSucceeded,
      title: "La convention a bien été mise à jour",
      message:
        "Les signataires ont reçu un email leur demandant de signer la version modifiée.",
    },
    "update.error": {
      action: conventionSlice.actions.updateConventionFailed,
      title: "Problème lors de la mise à jour de la convention",
      message:
        "Une erreur est survenue lors de la mise à jour de la convention",
    },
    "fetch.error": {
      action: conventionSlice.actions.fetchConventionFailed,
      title: "Problème lors de la récupération de la convention",
      message:
        "Une erreur est survenue lors de la récupération de la convention",
    },
  },
  "establishment-dashboard-discussion-list": {
    "fetch.error": {
      action: discussionSlice.actions.fetchDiscussionListFailed,
      title: "Problème lors de la récupération des discussions",
      message:
        "Une erreur est survenue lors de la récupération des discussions, essayez de rafraîchir la page.",
    },
  },
  "establishment-dashboard-users-rights": {
    "update.success": {
      action: establishmentSlice.actions.updateEstablishmentSucceeded,
      title: "L'utilisateur a été mis à jour",
      message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
    },
    "update.error": {
      action: establishmentSlice.actions.updateEstablishmentFailed,
      title: "Problème lors de la mise à jour de l'utilisateur",
      message:
        "Une erreur est survenue lors de la mise à jour de l'utilisateur",
    },
  },
  "establishment-dashboard-discussion-send-message": {
    "create.success": {
      action: discussionSlice.actions.sendExchangeSucceeded,
      title: "Message envoyé",
      message: "Le message a bien été envoyé",
    },
    "create.error": {
      action: discussionSlice.actions.sendExchangeFailed,
      title: "Problème lors de l'envoi du message",
      message:
        "Une erreur est survenue. Votre message n'a pas pu être envoyé. Veuillez réessayer dans quelques instants.",
    },
  },
  "login-by-email": {
    "create.success": {
      action: authSlice.actions.loginByEmailSucceded,
      title: "Votre lien de connexion a bien été envoyé",
      message: "",
    },
    "create.error": {
      action: authSlice.actions.loginByEmailFailed,
      title: "Nous n’avons pas pu envoyer le lien de connexion",
      message: "",
    },
  },
  "connected-user-conventions": {
    "fetch.error": {
      action:
        connectedUserConventionsToManageSlice.actions
          .getConventionsForConnectedUserFailed,
      title: "Problème lors de la récupération de vos conventions",
      message:
        "Une erreur est survenue lors de la récupération de vos conventions",
    },
  },
  "connected-user-conventionList": {
    "fetch.error": {
      action: conventionListSlice.actions.fetchConventionListFailed,
      title: "Problème lors de la récupération des conventions",
      message:
        "Une erreur est survenue lors de la récupération des conventions",
    },
  },
  "conventions-with-broadcast-feedback": {
    "fetch.error": {
      action:
        conventionsWithBroadcastFeedbackSlice.actions
          .getConventionsWithErroredBroadcastFeedbackFailed,
      title:
        "Problème lors de la récupération de vos conventions qui ont eu des erreurs de diffusion",
      message:
        "Une erreur est survenue lors de la récupération de vos conventions qui ont eu des erreurs de diffusion",
    },
  },
  "magic-link-interstitial": {
    "fetch.success": {
      action: authSlice.actions.confirmLoginByMagicLinkSucceeded,
      title: "Connexion réussie",
      message: "Vous êtes maintenant connecté à Immersion Facilitée",
    },
    "fetch.error": {
      action: authSlice.actions.confirmLoginByMagicLinkFailed,
      title: "Erreur de connexion",
      message:
        "Une erreur est survenue lors de la connexion via le lien magique",
    },
  },
  unused: {},
};
