import { frontRoutes } from "../routes/routes";
import {
  DiscussionDto,
  DiscussionReadDto,
  RejectionKind,
} from "./discussion.dto";

export const rejectDiscussionEmailParams = ({
  discussion,
  rejectionKind,
  rejectionReason,
}: {
  discussion: DiscussionDto | DiscussionReadDto;
  rejectionKind: RejectionKind;
  rejectionReason?: string;
}) => ({
  subject: `L’entreprise ${discussion.businessName} ne souhaite pas donner suite à votre candidature à l’immersion`, // TODO check content
  htmlContent: `Bonjour, 
  
Malheureusement, nous ne souhaitons pas donner suite à votre candidature à l’immersion.

La raison du refus est : ${makeRejectionText(rejectionKind, rejectionReason)}

N’hésitez pas à <a href="https://immersion-facile.beta.gouv.fr/${
    frontRoutes.search
  }">rechercher une immersion dans une autre entreprise</a> !

Bonne journée, 
${discussion.establishmentContact.firstName} ${
    discussion.establishmentContact.lastName
  }, représentant de l'entreprise ${discussion.businessName}`,
});

const makeRejectionText = (
  rejectionKind: RejectionKind,
  rejectionReason?: string,
) => {
  const textForRejectionKind: Record<RejectionKind, string> = {
    UNABLE_TO_HELP:
      "l’entreprise estime ne pas être en capacité de vous aider dans votre projet professionnel.",
    NO_TIME:
      "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.",
    OTHER: rejectionReason ?? "Raison du refus non spécifiée",
  };
  return textForRejectionKind[rejectionKind];
};
