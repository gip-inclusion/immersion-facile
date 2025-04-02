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
mkdir -p dbt-build/app

# Copy the bi folder contents while respecting .gitignore
cd ..
git archive HEAD:bi | tar -x -C bi/dbt-build/app

# Remove any .env files that might have been included
cd bi
find dbt-build -type f -name ".env*" -delete

# Create the final tar archive with simpler options
cd dbt-build
tar -czf ../dbt-build.tar.gz .

# Clean up
cd ..
#rm -rf dbt-build

echo "Built created successfully: dbt-build.tar.gz"
