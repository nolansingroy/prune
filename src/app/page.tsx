import Image from "next/image";
import { Signup } from "@/components/signup";
//prune landing page

export default function Home() {
  return (
    <div className="bg-custom-purple min-h-screen text-gray-800">
      <div className="flex flex-col items-center justify-center min-h-screen bg-custom-purple text-gray-800">
        {/* Section 1: Image */}
        <div className="w-full">
          <Image
            src="/prune.svg"
            alt="Event Image"
            width={1920}
            height={1080}
            sizes="100vw"
            style={{
              width: "100%",
              height: "auto",
            }}
          />
        </div>
        <div className="w-full bg-gray-800 py-4">
          <div className="flex items-center justify-center">
            <p className="text-xl md:text-2xl lg:text-3xl text-white font-bold">
              Maximize your coaching impact
            </p>
          </div>
        </div>
        <section className="container mx-auto flex flex-col md:flex-row p-6">
          {/* Image container */}
          <div className="md:w-2/3">
            <Image
              src="/coachlooking.png"
              alt="Coaching"
              width={640}
              height={360}
              className="w-full h-auto"
            />
          </div>

          <div className="md:w-1/2 max-w-md p-7 pt-3 md:pt-0 text-center">
            <h2 className="text-xl md:text-2xl text-white font-bold mb-4 pt-3">
              Streamline your scheduling challenges with a tool designed just
              for your solo coaching and training business.
            </h2>
            <Signup />
          </div>
        </section>

        <div className="text-center space-y-3 pb-8 m-4">
          <h3 className="text-xl md:text-xl lg:text-2xl text-white font-bold mt-2 pt-2">
            Transform your coaching business without paying the high cost of a
            solution that wasn&apos;t built for you.
          </h3>
          <p className="text-lg md:text-xl text-white pb-5">
            Getting started takes only minutes -- your clients will thank you
            for using Prune
          </p>
        </div>

        <div className="relative w-full">
          {/* Image */}
          <Image
            src="/skatingcoach.jpg"
            alt="Another Event Image"
            width={1920}
            height={1080}
            layout="responsive"
          />
          {/* Text overlay */}
          <div className="absolute top-1/4 left-0 transform -translate-y-1/2 p-6 text-left text-white">
            <h1 className="text-xl md:text-4xl font-bold mt-6 text-center">
              Scheduling, rescheduling, and billing all in one low cost app.
            </h1>
            <p className="text-2xl mb-4">
              <a href="" className="underline">
                Try a free trial today!
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
