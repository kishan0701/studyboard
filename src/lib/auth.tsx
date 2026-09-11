import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "student";

export type Profile = { id: string; name: string; email: string };

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setDemoUser: (role: AppRole, customName?: string, customEmail?: string) => void;
  switchRole: (newRole: AppRole) => void;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  setDemoUser: () => {},
  switchRole: () => {},
});

const DEMO_USER_KEY = "studyboard_demo_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Check stored demo session or supabase session on boot
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const storedDemo = localStorage.getItem(DEMO_USER_KEY);
      if (storedDemo) {
        const parsed = JSON.parse(storedDemo);
        setProfile({ id: parsed.id, name: parsed.name, email: parsed.email });
        setRole(parsed.role || "student");
        setSession({
          user: { id: parsed.id, email: parsed.email } as User,
          access_token: "demo-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "demo-refresh",
        } as Session);
        setLoading(false);
      } else {
        const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
          if (!nextSession) {
            setProfile(null);
            setRole(null);
          }
          setLoading(false);
        });
        unsubscribe = () => sub?.subscription?.unsubscribe();

        supabase.auth
          .getSession()
          .then(({ data }) => {
            if (data.session) {
              setSession(data.session);
            }
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
          });
      }
    } catch {
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    if (session?.access_token === "demo-token") return; // Demo session already loaded

    let active = true;
    void (async () => {
      try {
        const [profileRes, roleRes] = await Promise.all([
          supabase.from("profiles").select("id, name, email").eq("id", userId).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", userId),
        ]);
        if (!active) return;
        setProfile((profileRes.data as Profile | null) ?? null);
        const roles = (roleRes.data ?? []).map((r) => r.role as AppRole);
        setRole(roles.includes("admin") ? "admin" : roles.length ? "student" : "student");
      } catch {
        if (active && !profile) {
          const userMeta = session?.user?.user_metadata as Record<string, any> | undefined;
          setProfile({
            id: userId,
            name: userMeta?.["name"] || session?.user?.email?.split("@")[0] || "Student",
            email: session?.user?.email || "",
          });
          setRole("student");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, session]);

  const signOut = async () => {
    try {
      localStorage.removeItem(DEMO_USER_KEY);
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const setDemoUser = (userRole: AppRole, customName?: string, customEmail?: string) => {
    const demoId = userRole === "admin" ? "admin-demo-uuid" : "student-demo-uuid";
    const name =
      customName || (userRole === "admin" ? "Prof. Sharma (Admin)" : "Rahul Verma (Student)");
    const email =
      customEmail || (userRole === "admin" ? "admin@college.edu" : "student@college.edu");

    const demoProfile = { id: demoId, name, email, role: userRole };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoProfile));

    setProfile({ id: demoId, name, email });
    setRole(userRole);
    setSession({
      user: { id: demoId, email } as User,
      access_token: "demo-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "demo-refresh",
    } as Session);
  };

  const switchRole = (newRole: AppRole) => {
    if (session?.access_token === "demo-token") {
      setDemoUser(newRole);
    } else {
      setRole(newRole);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        role,
        loading,
        signOut,
        setDemoUser,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
