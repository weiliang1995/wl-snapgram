import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSignOutAccount } from "@/lib/react-query/queriesAndMutation";
import { useUserContext } from "@/context/AuthContext";
import { toast } from "@/components/ui/toast";
import { TOAST_TYPE } from "@/constants/toast";

const Header = () => {
  const { mutate: signOut, isPending: isSigningOut } = useSignOutAccount();
  const navigate = useNavigate();
  const { user } = useUserContext();

  function onSignOut() {
    signOut(undefined, {
      onSuccess: () => navigate(0),
      onError: (error) =>
        toast.add({
          type: TOAST_TYPE.ERROR,
          title: "Sign out failed",
          description: error.message,
        }),
    });
  }
  return (
    <section className="header">
      <div className="flex-between py-4 px-5">
        <Link to="/" className="flex gap-3 items-center">
          <img
            src="/assets/images/logo.svg"
            alt="logo"
            width={130}
            height={35}
          />
        </Link>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="shad-button_ghost cursor-pointer"
            onClick={onSignOut}
            disabled={isSigningOut}
          >
            <img src="/assets/icons/logout.svg" alt="logout" />
          </Button>
          <Link to={`/profile/${user.id}`} className="flex-center gap-3">
            <img
              src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-8 w-8 rounded-full"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Header;
