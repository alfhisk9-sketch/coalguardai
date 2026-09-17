SELECT 'organizations' as tbl, count(*) as cnt FROM organizations
UNION ALL SELECT 'mines', count(*) FROM mines
UNION ALL SELECT 'roles', count(*) FROM roles
UNION ALL SELECT 'permissions', count(*) FROM permissions
UNION ALL SELECT 'auth.users', count(*) FROM auth.users WHERE email LIKE '%@sih26024.test'
UNION ALL SELECT 'auth.identities', count(*) FROM auth.identities WHERE provider = 'email'
UNION ALL SELECT 'profiles', count(*) FROM profiles
UNION ALL SELECT 'user_roles', count(*) FROM user_roles
UNION ALL SELECT 'contractors', count(*) FROM contractors
UNION ALL SELECT 'contractor_workers', count(*) FROM contractor_workers
UNION ALL SELECT 'compliance_records', count(*) FROM compliance_records
UNION ALL SELECT 'inspections', count(*) FROM inspections
UNION ALL SELECT 'inspection_observations', count(*) FROM inspection_observations
UNION ALL SELECT 'corrective_actions', count(*) FROM corrective_actions
UNION ALL SELECT 'incidents', count(*) FROM incidents
UNION ALL SELECT 'environmental_readings', count(*) FROM environmental_readings
UNION ALL SELECT 'production_reports', count(*) FROM production_reports
UNION ALL SELECT 'worker_attendance', count(*) FROM worker_attendance
UNION ALL SELECT 'grievances', count(*) FROM grievances
UNION ALL SELECT 'notifications', count(*) FROM notifications
UNION ALL SELECT 'documents', count(*) FROM documents
UNION ALL SELECT 'risk_scores', count(*) FROM risk_scores
UNION ALL SELECT 'ai_recommendations', count(*) FROM ai_recommendations
UNION ALL SELECT 'anomaly_events', count(*) FROM anomaly_events
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;
