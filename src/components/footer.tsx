import React from "react";
import Link from "next/link";

const Header = () => {
  return (
    <header className="bg-gray-800 text-white">
      <h1>Footer</h1>
      <nav>
        <ul className="flex justify-between items-center p-4">
          <li>
            <Link href="/" className="text-xl hover:text-gray-300">
              Prune
            </Link>
          </li>
          {/* Add other navigation items here */}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
