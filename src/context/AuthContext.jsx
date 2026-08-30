import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

function toUser(authUser, profile) {
  if (!authUser || !profile) return null;
  return {
    id: authUser.id,
    name: profile.full_name,
    email: authUser.email,
    collegeId: profile.college_id,
    role: profile.role,
    verified: profile.verified,
  };
}

async function fetchProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncFromSession = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      return;
    }
    try {
      const profile = await fetchProfile(session.user.id);
      setUser(toUser(session.user, profile));
    } catch (error) {
      console.error("Could not load profile:", error.message);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      await syncFromSession(session);
      if (active) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await syncFromSession(session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const signup = async ({ name, email, collegeId, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim(), college_id: collegeId.trim() } },
    });
    if (error) throw new Error(error.message);
    if (!data.session) {
      // Email confirmation is required by this Supabase project's Auth settings.
      throw new Error("Account created. Check your email to confirm it, then log in.");
    }
    const profile = await fetchProfile(data.user.id);
    const nextUser = toUser(data.user, profile);
    setUser(nextUser);
    return nextUser;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "Invalid email or password." : error.message);
    const profile = await fetchProfile(data.user.id);
    const nextUser = toUser(data.user, profile);
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
