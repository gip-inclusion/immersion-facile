{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

/*
  This model transforms and analyzes the conventions (immersion applications) data
  to provide insights into immersion trends, statuses, and durations.
  It includes relationships with actors, agencies, and appellations.
*/

WITH conventions AS (
    SELECT 
        id,
        created_at,
        updated_at,
        status,
        agency_id,
        date_submission,
        date_start,
        date_end,
        siret,
        business_name,
        individual_protection,
        sanitary_prevention,
        sanitary_prevention_description,
        immersion_address,
        immersion_objective,
        immersion_activities,
        immersion_skills,
        work_conditions,
        immersion_appellation,
        date_validation,
        internship_kind,
        beneficiary_id,
        establishment_tutor_id,
        establishment_representative_id,
        beneficiary_representative_id,
        beneficiary_current_employer_id,
        business_advantages,
        status_justification,
        validators,
        renewed_from,
        renewed_justification,
        date_approval,
        acquisition_campaign,
        acquisition_keyword,
        establishment_number_employees,
        individual_protection_description,
        -- Calculate duration in days
        EXTRACT(EPOCH FROM (date_end - date_start)) / 86400 AS immersion_duration_days
    FROM {{ source('immersion', 'conventions') }}
),

actors AS (
    SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        signed_at
    FROM {{ source('immersion', 'actors') }}
),

agencies AS (
    SELECT 
        id AS agency_id,
        name AS agency_name,
        kind AS agency_kind,
        department_code
    FROM {{ source('immersion', 'agencies') }}
),

appellations AS (
    SELECT 
        ogr_appellation AS appellation_id,
        libelle_appellation_long AS appellation_label,
        code_rome AS rome_code
    FROM {{ source('immersion', 'public_appellations_data') }}
),

romes AS (
    SELECT 
        code_rome,
        libelle_rome AS rome_label
    FROM {{ source('immersion', 'public_romes_data') }}
),

immersion_assessments AS (
    SELECT 
        convention_id,
        status AS assessment_status,
        number_of_hours_actually_made,
        last_day_of_presence,
        number_of_missed_hours,
        ended_with_a_job,
        type_of_contract,
        contract_start_date,
        establishment_advices,
        establishment_feedback
    FROM {{ source('immersion', 'immersion_assessments') }}
)

SELECT
    c.id AS convention_id,
    c.created_at,
    c.updated_at,
    c.status,
    a.agency_name,
    a.agency_kind,
    a.department_code,
    c.date_submission,
    c.date_start,
    c.date_end,
    c.immersion_duration_days,
    c.siret,
    c.business_name,
    c.immersion_objective,
    c.immersion_activities,
    c.immersion_skills,
    c.work_conditions,
    app.appellation_label,
    app.rome_code,
    r.rome_label,
    c.internship_kind,
    c.date_validation,
    c.date_approval,
    c.establishment_number_employees,
    
    -- Beneficiary information
    ben.first_name AS beneficiary_first_name,
    ben.last_name AS beneficiary_last_name,
    ben.email AS beneficiary_email,
    ben.signed_at AS beneficiary_signed_at,
    
    -- Establishment tutor information
    tutor.first_name AS tutor_first_name,
    tutor.last_name AS tutor_last_name,
    tutor.email AS tutor_email,
    tutor.signed_at AS tutor_signed_at,
    
    -- Establishment representative information
    rep.first_name AS representative_first_name,
    rep.last_name AS representative_last_name,
    rep.email AS representative_email,
    rep.signed_at AS representative_signed_at,
    
    -- Assessment information
    ia.assessment_status,
    ia.number_of_hours_actually_made,
    ia.number_of_missed_hours,
    ia.ended_with_a_job,
    ia.type_of_contract,
    ia.contract_start_date,
    
    -- Time metrics
    DATE_TRUNC('day', c.date_submission) AS submission_date,
    DATE_TRUNC('month', c.date_submission) AS submission_month,
    DATE_TRUNC('quarter', c.date_submission) AS submission_quarter,
    DATE_TRUNC('year', c.date_submission) AS submission_year,
    
    -- Approval time in days (if approved)
    CASE 
        WHEN c.date_approval IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (c.date_approval - c.date_submission)) / 86400 
        ELSE NULL 
    END AS days_to_approval,
    
    -- Validation time in days (if validated)
    CASE 
        WHEN c.date_validation IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (c.date_validation - c.date_submission)) / 86400 
        ELSE NULL 
    END AS days_to_validation,
    
    -- Acquisition source
    COALESCE(c.acquisition_campaign, 'Unknown') AS acquisition_campaign,
    COALESCE(c.acquisition_keyword, 'Unknown') AS acquisition_keyword,
    
    -- Renewal information
    c.renewed_from,
    c.renewed_justification,
    
    -- Status information
    c.status_justification,
    
    -- Protection information
    c.individual_protection,
    c.individual_protection_description,
    c.sanitary_prevention,
    c.sanitary_prevention_description
    
FROM conventions c
LEFT JOIN agencies a ON c.agency_id = a.agency_id
LEFT JOIN appellations app ON c.immersion_appellation = app.appellation_id
LEFT JOIN romes r ON app.rome_code = r.code_rome
LEFT JOIN actors ben ON c.beneficiary_id = ben.id
LEFT JOIN actors tutor ON c.establishment_tutor_id = tutor.id
LEFT JOIN actors rep ON c.establishment_representative_id = rep.id
LEFT JOIN immersion_assessments ia ON c.id = ia.convention_id 