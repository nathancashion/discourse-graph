import type { Database } from "@repo/database/dbTypes";
import type { DGSupabaseClient } from "@repo/database/lib/client";

type AgentType = Database["public"]["Enums"]["AgentType"] | "group";

export const getSessionBaseUserData = async (
  client: DGSupabaseClient,
): Promise<{
  id: string;
  name?: string;
  type: AgentType;
  email?: string;
} | null> => {
  const session = await client.auth.getSession();
  if (!session?.data?.session?.user) return null;
  const { id, email } = session.data.session.user;
  if (email) {
    const [name, host] = email.split("@") as [string, string];
    if (host === "database.discoursegraphs.com" && name.endsWith("-anon")) {
      const parts = name.split("-");
      const spaceId = Number.parseInt(parts[1]!);
      const spaceReq = await client
        .from("Space")
        .select("name")
        .eq("id", spaceId)
        .maybeSingle();
      if (spaceReq.error || !spaceReq.data) {
        return null;
      }
      return { name: spaceReq.data.name, id, type: "anonymous", email };
    }
    if (host === "groups.discoursegraphs.com") {
      return { name, id, email, type: "group" };
    }
  }
  return { id, type: "person", email };
};

export const getSessionUserData = async (
  client: DGSupabaseClient,
): Promise<{
  id: string;
  name: string;
  type: AgentType;
  email?: string;
} | null> => {
  const data = await getSessionBaseUserData(client);
  if (data === null) return null;
  if (!data.name && data.type === "person") {
    const accountReq = await client
      .from("PlatformAccount")
      .select("name")
      .eq("dg_account", data.id)
      .eq("agent_type", "person")
      .maybeSingle();
    if (accountReq.error || !accountReq.data?.name) {
      return null;
    }
    return { ...data, name: accountReq.data.name };
  }
  if (data.name === undefined) return null;
  return data as {
    id: string;
    name: string; // typescript is being dumb
    type: AgentType;
    email?: string;
  };
};

export const getGroupMemberList = async (
  client: DGSupabaseClient,
  groupId: string,
): Promise<
  {
    id: string;
    name: string;
    agentType: AgentType; // eslint-disable-line @typescript-eslint/naming-convention
    admin: boolean;
  }[]
> => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const results = await client.rpc("group_members", { p_group_id: groupId });
  if (results.error) throw results.error;
  if (!results.data) return [];
  return (
    results.data
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .map(({ id, name, agent_type, admin }) => ({
        id,
        name,
        agentType: agent_type,
        admin,
      }))
      .filter(
        ({ id, name, agentType, admin }) =>
          admin !== null && id !== null && name !== null && agentType !== null,
      ) as unknown as {
      admin: boolean;
      id: string;
      name: string;
      agentType: AgentType;
    }[]
  );
};

export const createGroupInvitation = async ({
  client,
  groupId,
  admin = false,
}: {
  client: DGSupabaseClient;
  groupId: string;
  admin: boolean;
}): Promise<string | null> => {
  const userData = await getSessionBaseUserData(client);
  if (!userData) return null;
  const membershipReq = await client
    .from("group_membership")
    .select("admin")
    .eq("group_id", groupId)
    .eq("member_id", userData.id)
    .maybeSingle();
  if (membershipReq.data?.admin !== true) return null;
  const { data, error } = await client.rpc("create_secret_token", {
    v_payload: JSON.stringify({ groupId, type: "groupInvitation", admin }),
    expiry_interval: "60d",
  });
  if (error || !data) return null;
  return data;
};

export const acceptGroupInvitation = async (
  client: DGSupabaseClient,
  token: string,
): Promise<string | null> => {
  const userData = await getSessionBaseUserData(client);
  if (!userData) return "Not logged in";
  const { data, error } = await client.rpc("accept_group_invitation", {
    token,
  });
  if (error || !data) return "This token does not exist";
  return null;
};
