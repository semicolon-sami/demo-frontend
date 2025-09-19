// /src/supabase/diary.ts

import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export type DiaryEntry = {
  id: string;
  user_id: string;
  title: string;
  content: any; // JSON for TipTap editor content
  created_at: string;
  updated_at: string;
  media: DiaryMedia[];
  tags: string[];
};

export type DiaryMedia = {
  url: string;
  type: "image" | "video";
  name: string;
  tags?: string[]; // AI-generated tags for this media
};

// ----------- ENTRIES CRUD -----------

// Create a new diary entry
export async function createDiaryEntry({
  title,
  content,
  media = [],
  tags = [],
}: {
  title: string;
  content: any;
  media?: DiaryMedia[];
  tags?: string[];
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not logged in!");

  const { data, error } = await supabase
    .from("diary_entries")
    .insert([
      {
        user_id: user.id,
        title,
        content,
        media,
        tags,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as DiaryEntry;
}

// List all diary entries for the current user
export async function getDiaryEntries() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not logged in!");

  const { data, error } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as DiaryEntry[];
}

// Get a single diary entry by id
export async function getDiaryEntry(id: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not logged in!");

  const { data, error } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as DiaryEntry;
}

// Update an existing diary entry
export async function updateDiaryEntry({
  id,
  title,
  content,
  media,
  tags,
}: {
  id: string;
  title?: string;
  content?: any;
  media?: DiaryMedia[];
  tags?: string[];
}) {
  const toUpdate: any = { updated_at: new Date().toISOString() };
  if (title !== undefined) toUpdate.title = title;
  if (content !== undefined) toUpdate.content = content;
  if (media !== undefined) toUpdate.media = media;
  if (tags !== undefined) toUpdate.tags = tags;

  const { data, error } = await supabase
    .from("diary_entries")
    .update(toUpdate)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as DiaryEntry;
}

// Delete a diary entry
export async function deleteDiaryEntry(id: string) {
  const { error } = await supabase
    .from("diary_entries")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ----------- MEDIA UPLOADS -----------

// Upload image or video to Supabase Storage
export async function uploadDiaryMedia(file: File, user?: User) {
  if (!user) {
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !currentUser) throw new Error("Not logged in!");
    user = currentUser;
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  // Upload to "diary_media" storage bucket
  const { error } = await supabase.storage.from("diary_media").upload(filePath, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw error;

  // Get signed URL (valid 24hrs)
  const { data } = await supabase.storage
    .from("diary_media")
    .createSignedUrl(filePath, 60 * 60 * 24);

  return {
    name: file.name,
    path: filePath,
    url: data?.signedUrl ?? "",
    type: file.type.startsWith("video") ? "video" : "image",
  } as DiaryMedia;
}

// ----------- SEARCH / FILTER / TAGS -----------

// Search diary entries by keyword (title/content/tags)
export async function searchDiaryEntries(keyword: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not logged in!");

  const { data, error } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", user.id)
    .or(
      `title.ilike.%${keyword}%,content::text.ilike.%${keyword}%,tags.cs.{${keyword}}`
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as DiaryEntry[];
}

// Get all distinct tags for tag filter UI
export async function getDiaryTags() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Not logged in!");

  const { data, error } = await supabase
    .from("diary_entries")
    .select("tags")
    .eq("user_id", user.id);

  if (error) throw error;
  const tags = new Set<string>();
  (data || []).forEach((entry: { tags: string[] }) => {
    if (entry.tags && Array.isArray(entry.tags)) entry.tags.forEach((t) => tags.add(t));
  });
  return Array.from(tags);
}
