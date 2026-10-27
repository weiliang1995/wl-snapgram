import { INITIAL_STATE, INITIAL_USER } from "@/constants/auth";
import { getCurrentUser } from "@/lib/appwrite/api";
import type { IContextType, IUser } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext<IContextType>(INITIAL_STATE);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const checkAuthUser = async () => {
    try {
      setIsLoading(true);
      const currentAccount = await getCurrentUser();

      if (currentAccount) {
        setUser({
          id: currentAccount?.$id,
          name: currentAccount?.name,
          username: currentAccount?.username,
          email: currentAccount?.email,
          imageUrl: currentAccount?.imageUrl,
          bio: currentAccount?.bio,
        });
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (e) {
      console.log(e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (
      localStorage.getItem("cookieFallback") === null ||
      localStorage.getItem("cookieFallback") === "[]"
    ) {
      navigate("/sign-in");
    }
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
  useEffect(() => {
    window.__auth = value;
  }, [value]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useUserContext = () => useContext(AuthContext);
