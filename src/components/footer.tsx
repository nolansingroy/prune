import React from "react";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-custom-purple text-white">
      <nav className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
        {/* Contact Us with email link on the left */}
        <div className="col-span-2 md:col-span-1 flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-x-4">
          <span className="text-lg">Contact Us</span>
          <Link href="/" className="text-base hover:text-gray-300">
            info@prune.com
          </Link>
        </div>

        {/* Logo and Prune stacked on the right */}
        <div className="col-span-2 md:col-span-1 flex justify-end md:items-center space-x-2">
          <Image
            src="/logo.svg"
            alt="Event Image"
            width={50}
            height={50}
            layout="intrinsic"
          />
          <h1 className="text-2xl">Prune</h1>
          <span>© 2024</span>
        </div>

        {/* Get Social stacked on the right */}
        <div className="col-span-2 md:col-span-1 flex justify-end md:items-center space-x-4">
          <span className="text-2xl">Get Social</span>
          {/* Replace these spans with actual icons */}
          <Link href="/" className="text-base hover:text-gray-300">
            Facebook
          </Link>
        </div>
      </nav>
    </footer>
  );
};

export default Footer;
