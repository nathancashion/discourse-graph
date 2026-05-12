"use client";

import { createClient } from "~/utils/supabase/client";
import { getGroupMemberList } from "~/utils/supabase/account";
import { useState, useEffect } from "react";
import useInternalError from "~/utils/internalError";

type Member = Awaited<ReturnType<typeof getGroupMemberList>>[number];

const AGENT_TYPE_LABEL: Record<string, string> = {
  person: "Person",
  organization: "Organization",
  automated_agent: "Automated Agent",
  anonymous: "Anonymous",
  group: "Group",
};

export const ListGroupMembers = ({ groupId }: { groupId: string }) => {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const internalError = useInternalError();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const client = createClient();
        const data = await getGroupMemberList(client, groupId);
        setMembers(data);
      } catch (err) {
        const userMessage = "Could not load group members";
        setError(userMessage);
        internalError({ error: err, userMessage });
      }
    };
    void fetchMembers();
  }, [groupId, internalError]);

  if (error) return <p>Error: {error}</p>;
  if (members === null) return <p>Loading...</p>;
  if (members.length === 0) return <p>This group has no members.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b">
          <th className="py-2 pr-4 font-semibold">Name</th>
          <th className="py-2 pr-4 font-semibold">Type</th>
          <th className="py-2 font-semibold">Admin</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <tr key={m.id} className="border-b last:border-0">
            <td className="py-2 pr-4">{m.name}</td>
            <td className="text-muted-foreground py-2 pr-4">
              {AGENT_TYPE_LABEL[m.agentType] ?? m.agentType}
            </td>
            <td className="py-2">{m.admin ? "Yes" : "No"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
