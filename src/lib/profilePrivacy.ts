// Centralized profile privacy filter.
// By default (no flags), only username + score are public.
// Owners always see everything.

export interface RawProfile {
  user_id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  occupation?: string | null;
  age?: number | null;
  bio?: string | null;
  show_avatar?: boolean | null;
  show_display_name?: boolean | null;
  show_city?: boolean | null;
  show_occupation?: boolean | null;
  show_age?: boolean | null;
  show_bio?: boolean | null;
  show_linked_accounts?: boolean | null;
  [k: string]: any;
}

export const PROFILE_PRIVACY_FIELDS =
  "user_id, username, display_name, avatar_url, city, occupation, age, bio, show_avatar, show_display_name, show_city, show_occupation, show_age, show_bio, show_linked_accounts";

export function applyProfilePrivacy<T extends RawProfile>(
  profile: T | null | undefined,
  viewerId: string | null | undefined,
): T | null {
  if (!profile) return null;
  const isOwner = !!viewerId && viewerId === profile.user_id;
  if (isOwner) return profile;
  return {
    ...profile,
    display_name: profile.show_display_name ? profile.display_name : null,
    avatar_url: profile.show_avatar ? profile.avatar_url : null,
    city: profile.show_city ? profile.city : null,
    occupation: profile.show_occupation ? profile.occupation : null,
    age: profile.show_age ? profile.age : null,
    bio: profile.show_bio ? profile.bio : null,
  };
}
