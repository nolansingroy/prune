import Image from "next/image";
import { Signup } from "@/components/signup";
//prune landing page

export default function Home() {
  return (
    <div className="bg-custom-grey min-h-screen text-gray-800">
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-800">
        {/* Section 1: Image */}
        <div className="w-full">
          <Image
            src="/RebusProLogoBlack.png"
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

        <div className="w-full  bg-custom-grey">
          <div className="flex items-center justify-center ps-8 pt-8 pb-8">
            <p className="text-2xl md:text-3xl lg:text-4xl text-custom-green font-bold">
              Maximize your coaching impact
            </p>
          </div>
        </div>

        <section className="container mx-auto flex flex-col md:flex-row py-4 justify-center">
          {/* Image container */}
          <div className="md:w-2/3">
            <Image
              src="/coachlooking.png"
              alt="Coaching"
              width={640}
              height={360}
              className="w-full h-auto rounded-lg"
            />
          </div>
          <div className="md:w-1/2 max-w-md p-3 pt-3 md:pt-0 py-2 text-center">
            <h2 className="text-xl md:text-2xl text-custom-green align-middle font-bold mb-4 pt-3 py-8">
              Streamline your scheduling challenges with a tool designed just
              for your solo coaching and training business.
            </h2>
            <Signup />
          </div>
        </section>
        <div className="text-center space-y-3 pb-8 m-4">
          <h3 className="text-xl md:text-xl lg:text-2xl text-custom-green font-bold">
            Transform your coaching business without paying the high cost of a
          </h3>
        </div>
        <div className="relative w-full">
          {/* Image */}{" "}
          <Image
            src="/skatingcoach.jpg"
            alt="Another Event Image"
            width={1920}
            height={1080}
            layout="responsive"
          />
          {/* Text overlay */}
          <div className="absolute top-1/4 left-0 transform -translate-y-1/2 p-6 text-left text-custom-green">
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
