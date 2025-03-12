# Immersion BI

This repository contains the dbt (data build tool) project for Immersion BI's Business Intelligence.

## Setup Instructions

### Prerequisites

- Python 3.13 or higher
- PostgreSQL database

### Installation

1. Navigate to the `bi` directory
2. Run the setup script to create a virtual environment and install dependencies:

```bash
# Make the script executable (only needed once)
chmod +x setup.sh

# Run the setup script
./setup.sh
```

This script will:
- Create a Python virtual environment in `.venv`
- Install the required dependencies from `requirements.txt`

### Activating the Environment

To activate the virtual environment, use:

```bash
source activate.sh
```

### Configuration

The database connection is configured in `profiles.yml`. The configuration supports environment variables for flexible deployment.

#### Environment Variables

You can customize the database connection using environment variables. The easiest way is to use the `.env` file:

1. Copy the sample file to create your own `.env` file (if it doesn't exist already):
   ```bash
   cp .env.sample .env
   ```

2. Edit the `.env` file with your database credentials:
   ```bash
   # Database connection settings
   DBT_TARGET=dev
   DBT_HOST=localhost
   DBT_USER=immersion
   DBT_PASSWORD=your_password
   DBT_PORT=5432
   DBT_DATABASE=immersion-db
   DBT_SCHEMA=public
   DBT_THREADS=4
   ```

The `run_dbt.sh` script will automatically load these environment variables when you run dbt commands.

#### Using the Production Target

To use the production target, simply update your `.env` file with the production settings:

```bash
# Set target to production
DBT_TARGET=production

# Provide production connection details
DBT_HOST=your-production-host
DBT_USER=your-production-user
DBT_PASSWORD=your-production-password
DBT_DATABASE=your-production-database
```

You can also temporarily override the target on the command line without changing your `.env` file:
```bash
DBT_TARGET=production ./run_dbt.sh run
```

### Running dbt

Use the provided script to run dbt commands:

```bash
# Make the script executable (only needed once)
chmod +x run_dbt.sh

# Run dbt commands
./run_dbt.sh debug  # Test connection
./run_dbt.sh run    # Run all models
./run_dbt.sh test   # Run all tests
```

This script ensures that dbt uses the local `profiles.yml` file, loads environment variables from `.env`, and activates the virtual environment if needed.

## Project Structure

- `bi/` - The main BI directory
  - `.venv/` - Python virtual environment
  - `activate.sh` - Script to activate the virtual environment
  - `models/` - Contains SQL models
    - `conventions/` - Models related to conventions
    - `sources.yml` - Source definitions
  - `run_dbt.sh` - Script to run dbt commands
  - `profiles.yml` - Database connection configuration
  - `dbt_project.yml` - The main dbt project configuration file
  - `.env` - Environment variables for database connection (not in Git)
  - `.env.sample` - Sample environment variables file
  - `requirements.txt` - Python dependencies
  - `setup.sh` - Setup script

## Current Models

The project currently includes:
- `conventions` - Analytics for conventions data

## Development Workflow

1. Activate the virtual environment: `source activate.sh`
2. Create or modify models in the `models/` directory
3. Run `./run_dbt.sh run` to build the models
4. Run `./run_dbt.sh test` to test the models

## Documentation

For more information about dbt, visit [dbt documentation](https://docs.getdbt.com/). 