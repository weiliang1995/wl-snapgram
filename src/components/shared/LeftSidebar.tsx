import { sidebarLinks } from "@/constants";
import { useUserContext } from "@/context/AuthContext";
import type { INavLink } from "@/types";
import { Button } from "@/components/ui/button";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSignOutAccount } from "@/lib/react-query/queriesAndMutation";
import { toast } from "@/components/ui/toast";
import { TOAST_TYPE } from "@/constants/toast";

const LeftSidebar = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const { mutate: signOut, isPending: isSigningOut } = useSignOutAccount();
  const { pathname } = useLocation();

  function onSignOut() {
    return signOut(undefined, {
      onSuccess: () => navigate(0),
      onError: (error) =>
        toast.add({
          title: "Sign out failed",
          description: error.message,
          type: TOAST_TYPE.ERROR,
        }),
    });
  }

  return (
    <nav className="leftsidebar">
      <div className="flex flex-col gap-11">
        <Link to="/" className="flex gap-3 items-center">
          <img
            src="/assets/images/logo.svg"
            alt="logo"
            width={170}
            height={36}
          />
        </Link>
        <Link to={`/profile/${user.id}`} className="flex items-center gap-3">
          <img
            src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
            alt="profile"
            className="h-14 w-14 rounded-full"
          />
          <div className="flex flex-col">
            <p className="body-bold">{user.name}</p>
            <p className="small-regular text-light-3">@{user.username}</p>
          </div>
        </Link>
        <ul className="flex flex-col gap-6">
          {sidebarLinks.map((link: INavLink) => {
            const isActive = pathname === link.route;
            return (
              <li
                className={`leftsidebar-link group ${isActive && "bg-primary-500"}`}
                key={link.label}
              >
                <NavLink
                  to={link.route}
                  className="flex gap-4 items-center p-4"
                >
                  <img
                    src={link.imgURL}
                    alt={link.label}
                    className={`group-hover:invert-white ${isActive && "invert-white"}`}
                  />
                  {link.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
      <Button
        variant="ghost"
        className="shad-button_ghost cursor-pointer"
        onClick={onSignOut}
        disabled={isSigningOut}
      >
        <img src="/assets/icons/logout.svg" alt="logout" />
        <p className="small-medium lg:base-medium">Logout</p>
      </Button>
    </nav>
  );
};

export default LeftSidebar;
