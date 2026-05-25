import type { Profile } from "@errorlife/shared/types";
import { supabase } from "../supabase";
import { logger } from "../logger";

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    logger.error("profile.fetch", { error: error.message, userId });
    throw error;
  }
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  values: { display_name: string; username: string; bio?: string }
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: values.display_name,
      username: values.username,
      bio: values.bio ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    logger.error("profile.update", { error: error.message, userId });
    throw error;
  }
}

export async function checkUsernameAvailable(
  username: string,
  excludeUserId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", excludeUserId)
    .maybeSingle();

  return data === null;
}
