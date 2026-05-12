CREATE OR REPLACE VIEW public.my_accounts AS
SELECT
    id,
    name,
    platform,
    account_local_id,
    write_permission,
    active,
    agent_type,
    metadata,
    dg_account
FROM public."PlatformAccount"
WHERE id IN (
    SELECT "LocalAccess".account_id FROM public."LocalAccess"
        JOIN public."SpaceAccess" USING (space_id)
        JOIN public.my_user_accounts() ON (account_uid = my_user_accounts)
    WHERE permissions >= 'partial'
    UNION SELECT id FROM public."PlatformAccount" WHERE dg_account=auth.uid()
);

CREATE TYPE public.group_member_info AS (
    id BIGINT,
    name VARCHAR,
    platform public."Platform",
    agent_type public."AgentType",
    admin boolean
);

CREATE OR REPLACE FUNCTION public.group_members(p_group_id UUID) RETURNS SETOF public.group_member_info
STABLE
SET search_path = ''
LANGUAGE sql AS $$
    SELECT pa.id, pa.name, pa.platform, pa.agent_type, gm.admin FROM public.my_accounts AS pa JOIN public.group_membership AS gm ON (pa.dg_account=gm.member_id) WHERE gm.group_id=p_group_id;
$$;
