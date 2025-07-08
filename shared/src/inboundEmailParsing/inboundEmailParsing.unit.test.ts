import { createOpaqueEmail } from "./inboundEmailParsing.utils";

describe("inboundEmailParsing", () => {
  it("should create opaque email with long fullname truncated and keep firstname and lastname part", () => {
    const opaqueEmail = createOpaqueEmail({
      discussionId: "ab5ca3ad-d348-43b7-bdd6-5eddbbb0a274",
      replyDomain: "reply.immersion-facile.beta.gouv.fr",
      recipient: {
        kind: "establishment",
        firstname: "Fulgence Antoinette",
        lastname: "Pourroy de L'Auberivière de Quinsonas-Oudinot de Reggio",
      },
    });

    expect(opaqueEmail.split("@")[0].length).toBeLessThanOrEqual(64);

    expect(opaqueEmail).toBe(
      "fulgence-an_pourroy-de__ab5ca3ad-d348-43b7-bdd6-5eddbbb0a274_e@reply.immersion-facile.beta.gouv.fr",
    );
  });

  it("shouldn't truncate fullname if it's short", () => {
    const opaqueEmail = createOpaqueEmail({
      discussionId: "ab5ca3ad-d348-43b7-bdd6-5eddbbb0a274",
      replyDomain: "reply.immersion-facile.beta.gouv.fr",
      recipient: {
        kind: "establishment",
        firstname: "Philippe",
        lastname: "Didier",
      },
    });

    expect(opaqueEmail.split("@")[0].length).toBeLessThanOrEqual(64);

    expect(opaqueEmail).toBe(
      "philippe_didier__ab5ca3ad-d348-43b7-bdd6-5eddbbb0a274_e@reply.immersion-facile.beta.gouv.fr",
    );
  });
});
