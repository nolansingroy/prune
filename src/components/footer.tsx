import React from "react";
import Link from "next/link";
import Image from "next/image";

const Footer: React.FC = () => {
  return (
    <footer className="bg-custom-fade-blue text-custom-cream mt-auto">
      <nav className="flex grid-cols-1 md:flex-row md:gap-16 p-4 justify-between">
        {/* Contact Us with email link on the left */}
        <div className="text-2xl md:col-span-1 flex flex-col md:flex-row items-start md:items-center md:space-x-4">
          <span className="text-xl">Contact Us:</span>
          <Link
            href="mailto:info@rebuspro.com"
            className="text-xl hover:text-gray-300"
          >
            info@rebuspro.com
          </Link>
        </div>
        <div className="md:col-span-1 flex items-center justify-end space-x-1">
          <Image
            src="/RebusPrimaryHorizontalDark.png"
            alt="RebusProLogo Logo"
            width={150}
            height={150}
            layout="intrinsic"
          />
          <div className="flex flex-col items-end justify-end space-y-3">
            <h1 className="text-xl md:text-xl"> © 2024</h1>
          </div>
        </div>
      </nav>
    </footer>
  );
};

export default Footer;
