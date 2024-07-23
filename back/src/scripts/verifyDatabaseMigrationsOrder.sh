#!/bin/bash

# se mettre à jour par rapport à main
git fetch origin main

# comparer les deux branches git précédentes
# et identifier les nouveaux fichiers de migrations
diff=$(git diff --name-only --diff-filter=A origin/main)
if echo "$diff" | grep -q "/migrations/"; then
  migration_files=$(echo "$diff" | grep "/migrations/")
else
  migration_files=""
  echo "No migration files found."
fi

# dans le dossier /migrations:
# identifier le dernier fichier de migration trié par nom (et donc timestamp)
last_migration_file=$(ls -v ./src/config/pg/migrations | tail -n 1)

# renvoyer une erreur si le dernier fichier de migration n'a pas été créé dans cette branche git
echo "Dernier fichier de migration: $last_migration_file"
echo "Fichiers de migration dans cette PR: $migration_files"
if [ -n "$migration_files" ] && ! echo "$migration_files" | grep -q "$last_migration_file"; then
  echo "===> ❌ ERROR: Il y a des conflits de migration sur cette branche."
  exit 1
else
  echo "===> ✅ Il n'y a pas de conflit de migration."
fi
