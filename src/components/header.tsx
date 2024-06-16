"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image"; // Import the Image component from the correct package
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebaseAuth } from "../services/authService";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { PersonIcon } from "@radix-ui/react-icons";

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { authLogout } from "../services/authService";
// import { useRouter } from "next/router";

type Checked = DropdownMenuCheckboxItemProps["checked"];

const Header = () => {
  const { authUser } = useFirebaseAuth();
  const [showStatusBar, setShowStatusBar] = React.useState<Checked>(true);
  const [showActivityBar, setShowActivityBar] = React.useState<Checked>(false);
  const [showPanel, setShowPanel] = React.useState<Checked>(false);
  // const router = useRouter();

  const handleLogOut = async () => {
    try {
      await authLogout();
      // Perform any post-logout actions here, e.g., redirecting the user
      console.log("User logged out, redirecting...");
      // router.push("/login"); // Use the router instance to push the /login route
    } catch (error) {
      console.error("Error during logout process:", error);
    }
  };

  const handleMenuClick = () => {
    // Add your logic here
    console.log("Menu clicked");
  };

  const handleUserClick = () => {
    // Add your logic here
    console.log("User clicked");
  };
  // user Avatar Image function
  const renderAvatar = () => {
    if (authUser) {
      return (
        <Avatar>
          <AvatarImage
            // src="https://github.com/shadcn.png"
            // src="/personIcon.svg"
            alt="@shadcn"
            onClick={handleUserClick}
          />
          <AvatarFallback className="bg-custom-black">
            <PersonIcon className="text-white" viewBox="0 0 14 14" />
          </AvatarFallback>
        </Avatar>
      );
    } else {
      return <Link href="/signUp">Login</Link>;
    }
  };

  const renderHamburgerMenu = () => {
    if (authUser) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <HamburgerMenuIcon className="h-8 w-8"></HamburgerMenuIcon>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>
              <Link href="/">Home</Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link href="/calendar">Calendar</Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Dashboard</DropdownMenuItem>
              <DropdownMenuItem>Bookings</DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/clients">Clients</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Email</DropdownMenuItem>
                    <DropdownMenuItem>Message</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>More...</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuItem disabled>API</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              Billing
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/login" onClick={authLogout}>
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </Link>
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  };

  return (
    <header className="bg-custom-grey text-white">
      <nav>
        <ul className="flex items-center justify-between p-4">
          {/* {authUser && (
            <HamburgerMenuIcon
              className="h-8 w-8"
              onClick={handleMenuClick}
            ></HamburgerMenuIcon>
          )} */}
          <li>{renderHamburgerMenu()}</li>
          <li className="flex items-center">
            <Link
              href="/"
              className="flex items-center text-3xl hover:text-gray-300"
            >
              <Image
                src="/RebusProLogo.svg"
                alt="RebusPro Logo"
                width={50}
                height={50}
                className="inline-block"
              />
              <p className="ml-2 text-custom-green">REBUSPRO</p>
            </Link>
          </li>
          <li>{renderAvatar()}</li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
