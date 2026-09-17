-- 0011_rls.sql
-- Enforces mine-scope via fn_user_has_mine_access (user_roles-only) and contractor isolation
-- via profiles.contractor_id. See SECURITY.md 4b/4c and DATABASE.md 16.

alter table mines enable row level security;
create policy mines_select on mines for select using (fn_user_has_mine_access(id));
create policy mines_manage on mines for all using (fn_user_has_permission('mines.manage') and fn_user_has_mine_access(id));

alter table compliance_requirements enable row level security;
create policy compliance_req_select on compliance_requirements for select using (fn_user_has_mine_access(mine_id));
create policy compliance_req_manage on compliance_requirements for insert with check (fn_user_has_permission('compliance.manage') and fn_user_has_mine_access(mine_id));
create policy compliance_req_update on compliance_requirements for update using (fn_user_has_permission('compliance.manage') and fn_user_has_mine_access(mine_id));

alter table compliance_records enable row level security;
create policy compliance_rec_select on compliance_records for select using (fn_user_has_mine_access(mine_id));
create policy compliance_rec_manage on compliance_records for insert with check (fn_user_has_permission('compliance.manage') and fn_user_has_mine_access(mine_id));
create policy compliance_rec_update on compliance_records for update using (fn_user_has_permission('compliance.manage') and fn_user_has_mine_access(mine_id));

alter table inspections enable row level security;
create policy inspections_select on inspections for select using (fn_user_has_mine_access(mine_id));
create policy inspections_insert on inspections for insert with check (fn_user_has_permission('inspections.create') and fn_user_has_mine_access(mine_id));
create policy inspections_update on inspections for update using (
  fn_user_has_mine_access(mine_id) and (fn_user_has_permission('inspections.approve') or inspector_id = auth.uid())
);

alter table inspection_observations enable row level security;
create policy observations_select on inspection_observations for select using (
  exists (select 1 from inspections i where i.id = inspection_id and fn_user_has_mine_access(i.mine_id))
);
create policy observations_insert on inspection_observations for insert with check (
  fn_user_has_permission('inspections.create') and
  exists (select 1 from inspections i where i.id = inspection_id and fn_user_has_mine_access(i.mine_id))
);

alter table incidents enable row level security;
create policy incidents_select on incidents for select using (fn_user_has_mine_access(mine_id));
create policy incidents_insert on incidents for insert with check (fn_user_has_permission('incidents.create') and fn_user_has_mine_access(mine_id));
create policy incidents_update on incidents for update using (fn_user_has_permission('incidents.view') and fn_user_has_mine_access(mine_id));

alter table safety_observations enable row level security;
create policy safety_obs_select on safety_observations for select using (fn_user_has_mine_access(mine_id));
create policy safety_obs_insert on safety_observations for insert with check (fn_user_has_mine_access(mine_id));

-- Contractor isolation: never mine-only. Must resolve to the caller's own contractor record.
alter table contractors enable row level security;
create policy contractors_select on contractors for select using (
  fn_user_has_permission('contractors.view') and fn_user_has_mine_access(mine_id)
  or id = (select contractor_id from profiles where id = auth.uid())
);
create policy contractors_manage on contractors for all using (fn_user_has_permission('contractors.manage') and fn_user_has_mine_access(mine_id));

alter table contractor_workers enable row level security;
create policy contractor_workers_select on contractor_workers for select using (
  contractor_id = (select contractor_id from profiles where id = auth.uid())
  or exists (select 1 from contractors c where c.id = contractor_id and fn_user_has_permission('contractors.view') and fn_user_has_mine_access(c.mine_id))
);

alter table contractor_documents enable row level security;
create policy contractor_documents_select on contractor_documents for select using (
  contractor_id = (select contractor_id from profiles where id = auth.uid())
  or exists (select 1 from contractors c where c.id = contractor_id and fn_user_has_permission('contractors.view') and fn_user_has_mine_access(c.mine_id))
);

alter table worker_attendance enable row level security;
create policy attendance_select on worker_attendance for select using (
  exists (
    select 1 from contractor_workers w
    where w.id = worker_id
      and (w.contractor_id = (select contractor_id from profiles where id = auth.uid())
           or fn_user_has_mine_access(mine_id))
  )
);

alter table documents enable row level security;
create policy documents_select on documents for select using (
  mine_id is null or fn_user_has_mine_access(mine_id)
);
create policy documents_insert on documents for insert with check (fn_user_has_permission('documents.upload'));

alter table grievances enable row level security;
create policy grievances_select on grievances for select using (
  not is_confidential
  or submitted_by = auth.uid()
  or assigned_to = auth.uid()
  or (fn_user_has_permission('compliance.manage') and fn_user_has_mine_access(mine_id)) -- mine manager+ proxy
);
create policy grievances_insert on grievances for insert with check (fn_user_has_mine_access(mine_id));

alter table audit_logs enable row level security;
create policy audit_select on audit_logs for select using (fn_user_has_permission('audit.view'));
-- No insert/update/delete policy for any application role: audit rows are written exclusively
-- via a SECURITY DEFINER function (fn_log_audit, see below) invoked by trusted server-side code.

create or replace function fn_log_audit(
  p_action text, p_entity_type text, p_entity_id uuid,
  p_previous jsonb, p_new jsonb
) returns void as $$
begin
  insert into audit_logs(actor_id, role_key, action, entity_type, entity_id, previous_data, new_data)
  values (auth.uid(), null, p_action, p_entity_type, p_entity_id, p_previous, p_new);
end;
$$ language plpgsql security definer;
