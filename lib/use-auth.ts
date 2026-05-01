"use client";

import * as React from "react";
import { getCurrentUser, type SessionUser } from "./auth";

export const useAuth = (): { user: SessionUser | null; isReady: boolean } => {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    setUser(getCurrentUser());
    setIsReady(true);
    const onChange = () => setUser(getCurrentUser());
    window.addEventListener("nnu-auth-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("nnu-auth-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return { user, isReady };
};
