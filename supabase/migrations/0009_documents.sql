-- 0009_documents.sql
create type document_owner_type as enum ('COMPLIANCE','INSPECTION','INCIDENT','CONTRACTOR','GRIEVANCE','ENVIRONMENTAL','OTHER');
create type document_processing_status as enum ('NONE','PENDING','PROCESSED','FAILED');

create table documents (
  id uuid primary key default gen_random_uuid(),
  mine_id uuid references mines(id),
  owner_type document_owner_type not null,
  owner_id uuid,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  uploaded_by uuid references profiles(id),
  processing_status document_processing_status not null default 'NONE',
  extracted_text text,
  ocr_result jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_documents_owner on documents(owner_type, owner_id);

create table document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  version_no int not null,
  storage_path text not null,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- wire deferred FKs now that documents exists
alter table compliance_evidence add constraint fk_ce_document foreign key (document_id) references documents(id);
alter table inspection_observations add constraint fk_obs_document foreign key (photo_document_id) references documents(id);
alter table corrective_actions add constraint fk_ca_document foreign key (completion_evidence_id) references documents(id);
alter table incident_evidence add constraint fk_ie_document foreign key (document_id) references documents(id);
alter table contractor_documents add constraint fk_cd_document foreign key (document_id) references documents(id);
alter table environmental_readings add constraint fk_er_document foreign key (evidence_document_id) references documents(id);
alter table grievance_evidence add constraint fk_ge_document foreign key (document_id) references documents(id);

create trigger trg_documents_updated before update on documents for each row execute function fn_set_updated_at();
