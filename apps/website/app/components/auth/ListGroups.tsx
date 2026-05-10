"use client";

import { createClient } from "~/utils/supabase/client";
import { getSessionUserData } from "~/utils/supabase/dbUtils";
import { useState, useEffect } from "react";
import { Tables } from "@repo/database/dbTypes";

type GroupData = Tables<"my_groups">;

export const ListGroups = () => {
  const [groupData, setGroupData] = useState<GroupData[] | null>(null);
  const [adminData, setAdminData] = useState<Record<string, boolean>>({});
  const [userName, setUserName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getGroups = async () => {
      try {
        const client = createClient();
        const userData = await getSessionUserData(client);
        if (!userData) {
          setError("Not logged in");
          return;
        }
        const { name, type, id } = userData;
        if (type === "anonymous") setUserName("Space " + name);
        else if (type === "group") setUserName("group " + name);
        else if (type === "person") setUserName(name);
        const groupResponse = await client.from("my_groups").select();
        if (groupResponse.error) {
          setError(groupResponse.error.message);
          return;
        }
        setGroupData(groupResponse.data);
        const membershipReq = await client
          .from("group_membership")
          .select("group_id,admin")
          .eq("member_id", id);
        if (membershipReq.error) {
          setError(membershipReq.error.message);
          return;
        }
        setAdminData(
          Object.fromEntries(
            // eslint-disable-next-line @typescript-eslint/naming-convention
            membershipReq.data.map(({ group_id, admin }) => [
              group_id,
              admin || false,
            ]),
          ),
        );
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unknown error occurred",
        );
      }
    };
    void getGroups();
  }, []);

  return (
    <div>
      <div>{userName ? <p>Logged in as {userName}</p> : ""}</div>
      <div>
        {error ? (
          "Error: " + error
        ) : groupData === null ? (
          "loading"
        ) : groupData.length === 0 ? (
          <p>You are not part of any group.</p>
        ) : (
          <>
            <p>Your groups:</p>
            <ul>
              {groupData.map((d) => (
                <li key={d.id}>
                  {adminData[d.id || ""] ? (
                    <a href={"group/" + d.id!}>{d.name}</a>
                  ) : (
                    d.name
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
