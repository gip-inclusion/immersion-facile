import { errors } from "../errors/errors";
import { frontRoutes } from "../routes/route.utils";
import type {
  DiscussionDto,
  DiscussionReadDto,
  WithDiscussionId,
  WithDiscussionStatusRejected,
} from "./discussion.dto";

export const rejectDiscussionEmailParams = (
  params: WithDiscussionStatusRejected & WithDiscussionId,
  discussion: DiscussionDto | DiscussionReadDto,
) => ({
  subject: `L’entreprise ${discussion.businessName} ne souhaite pas donner suite à votre candidature à l’immersion`, // TODO check content
  htmlContent: `Bonjour, 
  
Malheureusement, nous ne souhaitons pas donner suite à votre candidature à l’immersion.

La raison du refus est : ${makeRejectionText(params)}

N’hésitez pas à <a href="https://immersion-facile.beta.gouv.fr/${
    frontRoutes.search
  }">rechercher une immersion dans une autre entreprise</a> !

Bonne journée, 
${discussion.establishmentContact.firstName} ${
    discussion.establishmentContact.lastName
  }, représentant de l'entreprise ${discussion.businessName}`,
});

const makeRejectionText = (
  params: WithDiscussionStatusRejected & WithDiscussionId,
): string => {
  if (params.rejectionKind === "OTHER") return params.rejectionReason;
  if (params.rejectionKind === "UNABLE_TO_HELP")
    return "l’entreprise estime ne pas être en capacité de vous aider dans votre projet professionnel.";
  if (params.rejectionKind === "NO_TIME")
    return "l’entreprise traverse une période chargée et n’a pas le temps d’accueillir une immersion.";
  throw errors.discussion.unsupportedRejectionKind(params.rejectionKind);
};
