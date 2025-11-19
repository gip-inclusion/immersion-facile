{{
  config(
    materialized='table',
    schema='analytics'
  )
}}

select
    au.agency_id,
    au.user_id,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name,
    concat(u.first_name, ' ', u.last_name) as user_full_name,
    au.roles,
    au.is_notified_by_email,
    u.created_at as user_created_at,
    u.updated_at as user_updated_at,
    u.pro_connect_sub,
    u.last_login_at
from {{ source('immersion', 'users__agencies') }} as au
inner join {{ source('immersion', 'users') }} as u
    on u.id = au.user_id
