import { INITIAL_STATE, INITIAL_USER } from "@/constants/auth";
import { getCurrentUser } from "@/lib/appwrite/api";
import type { IContextType, IUser } from "@/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext<IContextType>(INITIAL_STATE);

const hasSession = () => {
  const cookieFallback = localStorage.getItem("cookieFallback");
  return cookieFallback !== null && cookieFallback !== "[]";
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState(hasSession);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const applyUser = (
    currentAccount: Awaited<ReturnType<typeof getCurrentUser>>,
  ) => {
    if (!currentAccount) return false;
    setUser({
      id: currentAccount.$id,
      name: currentAccount.name,
      username: currentAccount.username,
      email: currentAccount.email,
      imageUrl: currentAccount.imageUrl,
      bio: currentAccount.bio,
    });
    setIsAuthenticated(true);
    return true;
  };

  const checkAuthUser = async () => {
    try {
      setIsLoading(true);
      return applyUser(await getCurrentUser());
    } catch (e) {
      console.log(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasSession()) {
      navigate("/sign-in");
      return;
    }
    getCurrentUser()
      .then(applyUser)
      .catch((e) => {
        console.log(e);
        return false;
      })
      .then((isLoggedIn) => {
        if (!isLoggedIn) navigate("/sign-in");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useUserContext = () => useContext(AuthContext);
