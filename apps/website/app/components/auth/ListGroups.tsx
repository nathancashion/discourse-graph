"use client";

import { createClient } from "~/utils/supabase/client";
import { getSessionUserData } from "~/utils/supabase/dbUtils";
import { useState, useEffect } from "react";
import { Tables } from "@repo/database/dbTypes";

type GroupData = Tables<"my_groups">;

export const ListGroups = () => {
  const [groupData, setGroupData] = useState<GroupData[] | null>(null);
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
        const { name, type } = userData;
        if (type === "anonymous") setUserName("Space " + name);
        else if (type === "group") setUserName("group " + name);
        else if (type === "person") setUserName(name);
        const response = await client.from("my_groups").select();
        if (response.error) {
          setError(response.error.message);
          return;
        }
        setGroupData(response.data);
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
                  <a href={"group/" + d.id!}>{d.name}</a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
