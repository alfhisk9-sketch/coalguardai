-- rls_smoke_test.sql — proves RLS actually isolates data, not just that it "compiles".
\set ON_ERROR_STOP on

-- seed minimal org/mine/role/permission graph
insert into organizations(id,name,code) values ('00000000-0000-0000-0000-000000000001','Coal India Ltd','CIL');
insert into subsidiaries(id,organization_id,name,code) values ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','SECL','SECL');
insert into regions(id,subsidiary_id,name,code) values ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000002','Region1','R1');
insert into mines(id,region_id,name,code,mine_type) values
 ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000003','Shakti Open Cast Mine','SHK','OPEN_CAST'),
 ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000003','Surya Coal Mine','SUR','OPEN_CAST');

insert into roles(id,key,name) values
 ('00000000-0000-0000-0000-000000000020','MINE_MANAGER','Mine Manager'),
 ('00000000-0000-0000-0000-000000000021','CONTRACTOR','Contractor'),
 ('00000000-0000-0000-0000-000000000022','SUPER_ADMIN','Super Admin');

insert into permissions(id,key) values ('00000000-0000-0000-0000-000000000030','mines.view');
insert into role_permissions values ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000030');

-- two auth.users + profiles: manager scoped to Shakti only, and two isolated contractors
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-000000000100','manager@shakti.test'),
 ('00000000-0000-0000-0000-000000000101','contractorA@test'),
 ('00000000-0000-0000-0000-000000000102','contractorB@test');

insert into contractors(id,mine_id,company_name) values
 ('00000000-0000-0000-0000-000000000200','00000000-0000-0000-0000-000000000010','Contractor A Pvt Ltd'),
 ('00000000-0000-0000-0000-000000000201','00000000-0000-0000-0000-000000000010','Contractor B Pvt Ltd');

insert into profiles(id,full_name,email) values
 ('00000000-0000-0000-0000-000000000100','Manager Shakti','manager@shakti.test');
insert into profiles(id,full_name,email,contractor_id) values
 ('00000000-0000-0000-0000-000000000101','Contractor A User','contractorA@test','00000000-0000-0000-0000-000000000200'),
 ('00000000-0000-0000-0000-000000000102','Contractor B User','contractorB@test','00000000-0000-0000-0000-000000000201');

insert into user_roles(user_id,role_id,mine_id) values
 ('00000000-0000-0000-0000-000000000100','00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000010');
insert into user_roles(user_id,role_id,mine_id) values
 ('00000000-0000-0000-0000-000000000101','00000000-0000-0000-0000-000000000021',null),
 ('00000000-0000-0000-0000-000000000102','00000000-0000-0000-0000-000000000021',null);

insert into contractor_workers(id,contractor_id,full_name) values
 ('00000000-0000-0000-0000-000000000300','00000000-0000-0000-0000-000000000200','Worker A1'),
 ('00000000-0000-0000-0000-000000000301','00000000-0000-0000-0000-000000000201','Worker B1');

-- TEST 1: Mine manager scoped to Shakti should NOT see Surya
select set_config('app.current_user_id','00000000-0000-0000-0000-000000000100', false);
select 'TEST1 manager sees only own mine' as test,
       count(*) filter (where id='00000000-0000-0000-0000-000000000010') as sees_shakti,
       count(*) filter (where id='00000000-0000-0000-0000-000000000011') as sees_surya
from mines;

-- TEST 2: Contractor A must not see Contractor B's workers
select set_config('app.current_user_id','00000000-0000-0000-0000-000000000101', false);
select 'TEST2 contractorA worker visibility' as test,
       count(*) filter (where contractor_id='00000000-0000-0000-0000-000000000200') as own_workers,
       count(*) filter (where contractor_id='00000000-0000-0000-0000-000000000201') as other_contractor_workers
from contractor_workers;

-- TEST 3: Contractor B symmetric check
select set_config('app.current_user_id','00000000-0000-0000-0000-000000000102', false);
select 'TEST3 contractorB worker visibility' as test,
       count(*) filter (where contractor_id='00000000-0000-0000-0000-000000000201') as own_workers,
       count(*) filter (where contractor_id='00000000-0000-0000-0000-000000000200') as other_contractor_workers
from contractor_workers;

-- TEST 4: idempotent insert (client_operation_id) — second insert with same key must not duplicate
select set_config('app.current_user_id','00000000-0000-0000-0000-000000000100', false);
insert into permissions(id,key) values ('00000000-0000-0000-0000-000000000031','inspections.create');
insert into role_permissions values ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000031');
insert into inspections(mine_id, inspector_id, inspection_type, client_operation_id)
values ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000100','ROUTINE','aaaaaaaa-0000-0000-0000-000000000001')
on conflict (client_operation_id) where client_operation_id is not null do nothing;
insert into inspections(mine_id, inspector_id, inspection_type, client_operation_id)
values ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000100','ROUTINE','aaaaaaaa-0000-0000-0000-000000000001')
on conflict (client_operation_id) where client_operation_id is not null do nothing;
select 'TEST4 idempotent insert count (expect 1)' as test, count(*) from inspections where client_operation_id='aaaaaaaa-0000-0000-0000-000000000001';

-- TEST 5: unauthenticated (no session var set) sees nothing
select set_config('app.current_user_id', '', false);
select 'TEST5 unauthenticated mine visibility (expect 0)' as test, count(*) from mines;
