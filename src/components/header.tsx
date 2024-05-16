import React from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";
import Image from "next/image"; // Import the Image component from the correct package

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "../components/ui/navigation-menu";

import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

const Header = () => {
  return (
    <header className="bg-custom-purple text-white">
      {/* <NavigationMenuItem>
        <Link href="/docs" legacyBehavior passHref>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Documentation
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem> */}

      <nav>
        {/* <Image
          src="/logo.svg"
          alt="Event Image"
          width={50}
          height={50}
          // sizes="100vw"
          style={{
            width: "50px",
            height: "50px",
          }}
        /> */}

        <ul className="flex justify-between items-center p-4">
          <Image
            src="/logo.svg"
            alt="Event Image"
            width={50}
            height={50}
            // sizes="100vw"
            style={{
              width: "50px",
              height: "50px",
            }}
          />
          <li>
            <Link href="/" className="text-xl hover:text-gray-300 align-left">
              Prune
            </Link>
          </li>
          <li>
            <Button>Sign Up</Button>
            {/* <Link href="/about">About</Link> */}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
