"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authLogout, useFirebaseAuth } from "@/services/authService";
// import { signOut, useSession } from 'next-auth/react';
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { auth } from "../../../firebase";
import { DecodedIdToken } from "next-firebase-auth-edge/lib/auth";

type UserNavProps = {
  token: DecodedIdToken;
};

export function UserNav({ token }: UserNavProps) {
  const { authUser } = useFirebaseAuth();
  const router = useRouter();
  const handleLogOut = async () => {
    try {
      await signOut(auth);
      await fetch("/api/logout");
      console.log("User logged out, redirecting...");
      router.push("/");
    } catch (error) {
      console.error("Error during logout process:", error);
    }
  };

  if (token) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={token.picture ?? ""} alt={token.name ?? ""} />
              <AvatarFallback>
                {token.email?.slice(0, 1)?.toUpperCase() || "CN"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{token.email}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {token.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Billing
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            {/* <DropdownMenuItem>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem> */}
            {/* <DropdownMenuItem>New Team</DropdownMenuItem> */}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogOut}>
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
