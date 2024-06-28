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

Malheureusement, l’entreprise ${discussion.businessName} ne souhaite pas donner suite à votre candidature à l’immersion.
Nous proposons aux entreprises de vous envoyer cette réponse rapide afin que vous soyez fixé sur l’issue de cette candidature et que vous puissiez postuler ailleurs. 

La raison du refus est : ${makeRejectionText(rejectionKind, rejectionReason)}

N’hésitez pas à envoyer d’autre candidatures !

Bonne journée, L’équipe immersion Facilitée`,
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
