import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getDiaryEntries } from "@/supabase/diary";

type Profile = {
  id: string;
  email: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
};

export default function DiaryProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entryCount, setEntryCount] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setProfile(user as Profile);
      const entries = await getDiaryEntries();
      setEntryCount(entries.length);
    })();
  }, []);

  if (!profile) return null;

  const displayName =
    profile.user_metadata?.full_name || profile.email.split("@")[0];

  return (
    <div className="flex items-center gap-3 py-2 px-3 mb-5 bg-blue-50 dark:bg-blue-950 rounded-xl shadow">
      {profile.user_metadata?.avatar_url ? (
        <img
          src={profile.user_metadata.avatar_url}
          alt="Avatar"
          className="w-12 h-12 rounded-full border"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-lg border">
          {displayName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div>
        <div className="font-semibold text-blue-800 dark:text-blue-200">{displayName}</div>
        <div className="text-xs text-gray-500">{profile.email}</div>
        <div className="text-xs text-gray-600 mt-1">Diary entries: {entryCount}</div>
      </div>
    </div>
  );
}
