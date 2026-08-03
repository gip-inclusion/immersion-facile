#!/bin/bash
# ---------------------------------------------------------
# IMPORTATION : Date ou Texte
# ---------------------------------------------------------
ORG="Immersion-Facilitee"
PROJ_NUM=2
FILE="export_p13.json"
FIELD_NAME_FILE="fin" # Début (Date), Fin (Date)
FIELD_NAME_PROJET="Fin"

echo "⏳ Préparation du champ $FIELD_NAME..."
PROJ_ID=$(gh project view $PROJ_NUM --owner "$ORG" --format json | jq -r '.id')
FIELD_ID=$(gh project field-list $PROJ_NUM --owner "$ORG" --format json | jq -r ".fields[] | select(.name == \"$FIELD_NAME_PROJET\") | .id")
echo "project Id : $PROJ_ID"
echo "field Id : $FIELD_ID"

jq -c '.items[]' "$FILE" | while read -r item; do
  URL=$(echo "$item" | jq -r '.content.url // empty')
  VALUE=$(echo "$item" | jq -r ".\"$FIELD_NAME_FILE\" // empty")

  if [ -n "$URL" ] && [ -n "$VALUE" ] && [ "$VALUE" != "null" ]; then
    ITEM_ID=$(gh project item-add $PROJ_NUM --owner "$ORG" --url "$URL" --format json | jq -r '.id')
    
    gh project item-edit --id "$ITEM_ID" --project-id "$PROJ_ID" --field-id "$FIELD_ID" --date "$VALUE" > /dev/null
    
    echo "✅ $URL -> $FIELD_NAME_PROJET : $VALUE"
  fi
done