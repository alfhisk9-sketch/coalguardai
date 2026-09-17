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
