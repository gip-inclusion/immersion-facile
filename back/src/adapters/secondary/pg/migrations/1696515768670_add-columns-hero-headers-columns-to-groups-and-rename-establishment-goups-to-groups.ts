import { MigrationBuilder } from "node-pg-migrate";

const oldGroupTableName = "establishment_groups";
const oldGroupSiretTableName = "establishment_groups__sirets";

const newGroupTableName = "groups";
const newGroupSiretTableName = "groups__sirets";

const heroHeaderTitle = "hero_header_title";
const heroHeaderDescription = "hero_header_description";
const heroHeaderLogoUrl = "hero_header_logo_url";
const heroHeaderBackgroundColor = "hero_header_background_color";
const tintColor = "tint_color";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable(oldGroupTableName, newGroupTableName);
  pgm.renameTable(oldGroupSiretTableName, newGroupSiretTableName);

  pgm.addColumns(newGroupTableName, {
    [heroHeaderTitle]: {
      type: "text",
      notNull: true,
      default: "Titre à saisir",
    },
    [heroHeaderDescription]: {
      type: "text",
      notNull: true,
      default: "Description à saisir",
    },
    hero_header_logo_url: { type: "text", notNull: false },
    hero_header_background_color: { type: "text", notNull: false },
    tint_color: { type: "text", notNull: false },
  });

  pgm.alterColumn(newGroupTableName, heroHeaderTitle, {
    default: null,
  });
  pgm.alterColumn(newGroupTableName, heroHeaderDescription, {
    default: null,
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns(newGroupTableName, [
    heroHeaderTitle,
    heroHeaderDescription,
    heroHeaderLogoUrl,
    heroHeaderBackgroundColor,
    tintColor,
  ]);
  pgm.renameTable(newGroupTableName, oldGroupTableName);
  pgm.renameTable(newGroupSiretTableName, oldGroupSiretTableName);
}
