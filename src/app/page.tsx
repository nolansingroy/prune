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
        {/* Section 2: Image with Text */}
        <div className="w-full">
          <div className="flex items-center justify-center">
            <p className="text-4xl text-white font-bold p-8 ">
              Maximize your coaching impact
            </p>
          </div>
        </div>

        <section className="container mx-auto flex p-6">
          {/* Image container */}
          <div className="flex-1">
            <Image
              src="/coachlooking.png"
              alt="Coaching"
              width={640}
              height={360}
              layout="responsive"
            />
          </div>

          <div className="flex-1 max-w-md p-7 pt-300 text-center">
            <h2 className="text-2xl  text-white font-bold mb-4">
              Streamline your scheduling challenges with a tool designed just
              for your solo coaching and training business.
            </h2>
            <Signup />
          </div>
        </section>

        {/* Section 2: Text */}
        <div className="my-12 p-6 text-center">
          <h3 className="text-5xl text-white font-bold mb-4">
            Transform your coaching business without paying the high cost of a
            solution that wasn&apos;t built for you.
          </h3>
          <p className="text-xl  text-white mb-4">
            Getting started takes only minutes -- your clients will thank you
            for using Prune
          </p>
          {/* <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Browse Events
          </button> */}
        </div>

        {/* Section 3: Image */}
        {/* <div className="my-12 p-6 text-center  text-white">
          <h1 className="text-5xl font-bold mb-4">
            Scheduling, rescheduling, and billing all in one low cost app.
          </h1>
          <p className="text-xl mb-4">
            <a href="" className="underline">
              Try a free trial today!
            </a>
          </p>
        </div>

        <div className="w-full">
          <Image
            src="/skating2.png"
            alt="Another Event Image"
            width={1920}
            height={1080}
            layout="responsive"
          />
        </div> */}

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
            <h1 className="text-4xl font-bold mb-4 text-center">
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
