#!/bin/bash

# Check if we're in the bi directory
CURRENT_DIR=$(basename "$PWD")
if [ "$CURRENT_DIR" != "bi" ]; then
    echo "Error: This script must be run from the 'bi' directory"
    echo "Current directory: $PWD"
    echo "Usage: cd bi && ./build.sh"
    exit 1
fi

# Create a temporary directory for the bundle
mkdir -p dbt-bundle

# Copy the bi folder contents while respecting .gitignore
cd ..
git archive HEAD:bi | tar -x -C bi/dbt-bundle

# Remove any .env files that might have been included
cd bi
find dbt-bundle -type f -name ".env*" -delete

# Create the final tar archive
tar -czf dbt-bundle.tar.gz -C dbt-bundle .

# Clean up
rm -rf dbt-bundle

echo "Bundle created successfully: dbt-bundle.tar.gz"
