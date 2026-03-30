"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import type { Profile } from "@/types";

// Profile cache tồn tại trong session — không cần TTL vì
// profile hiếm khi thay đổi và auth state change sẽ refetch
let _cachedProfile: Profile | null = null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(_cachedProfile);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    let ignore = false;

    async function fetchProfile(userId: string) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (!ignore) {
          setProfile(data);
          _cachedProfile = data;
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (!ignore) setLoading(false);

        if (currentUser) {
          if (!ignore) fetchProfile(currentUser.id);
        } else {
          setProfile(null);
          _cachedProfile = null;
        }
      }
    );

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    setUser(null);
    setProfile(null);
    _cachedProfile = null;
  }

  return { user, profile, loading, signOut };
}
