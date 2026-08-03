#!/bin/bash

SOURCE_ORG="gip-inclusion"

echo "📦 Exportation de 'Immersion Facilitée' (ID 10)..."
gh project item-list 10 --owner "$SOURCE_ORG" --format json --limit 2000 > export_p10.json

echo "📦 Exportation de 'IF Epics' (ID 13)..."
gh project item-list 13 --owner "$SOURCE_ORG" --format json --limit 2000 > export_p13.json

echo "✅ Export terminé ! Les fichiers export_p10.json et export_p13.json ont été créés."