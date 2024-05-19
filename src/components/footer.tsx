import React from "react";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-custom-purple text-white">
      <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Contact Us with email link on the left */}
        <div className=" md:col-span-1 flex flex-col md:flex-row items-start md:items-center md:space-x-4">
          <span className="text-xl">Contact Us:</span>
          <Link
            href="mailto:info@prune.com"
            className="text-base hover:text-gray-300"
          >
            info@prune.com
          </Link>
        </div>
        {/* Logo and Prune stacked on the right */}
        <div className="md:col-span-1 flex items-center justify-end space-x-2">
          <Image
            src="/logo.svg"
            alt="Prune Logo"
            width={50}
            height={50}
            layout="intrinsic"
          />
          <h1 className="text-xl md:text-3xl">Prune</h1>
          <span>© 2024</span>
        </div>
      </nav>
    </footer>
  );
};

export default Footer;
