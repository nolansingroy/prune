import React from "react";
import Link from "next/link";
import { Button } from "../components/ui/button";

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
    <header className="bg-gray-800 text-white">
      {/* <NavigationMenuItem>
        <Link href="/docs" legacyBehavior passHref>
          <NavigationMenuLink className={navigationMenuTriggerStyle()}>
            Documentation
          </NavigationMenuLink>
        </Link>
      </NavigationMenuItem> */}
      <nav>
        <ul className="flex justify-between items-center p-4">
          <li>
            <Link href="/" className="text-xl hover:text-gray-300">
              Prune
            </Link>
          </li>
          <li>
            <Button>Click me</Button>
            <Link href="/about">About</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
