import PageContainer from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { reminder, subscribe } from "../../../../public";

export default function OptInWorkflow() {
  return (
    <PageContainer scrollable>
      <div className="mx-auto py-10 px-4 sm:px-6 lg:px-8 font-openSans">
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-800">
              Text Messaging Opt-In Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose lg:prose-lg mx-auto text-gray-700">
              <p>
                At <strong>RebusPro</strong>, we value clear communication and
                providing exceptional service to our customers. Our text
                messaging reminder system is designed to ensure clients never
                miss an important event while giving them full control over
                their preferences. Below is an outline of how our opt-in process
                works, ensuring a seamless and transparent experience for
                everyone.
              </p>

              <h2 className="text-2xl font-semibold mt-8 text-gray-800">
                Step 1: Phone Number Entry
              </h2>
              <p>
                When a client’s account is created in RebusPro, their phone
                number is added to the system.
              </p>

              <h2 className="text-2xl font-semibold mt-8 text-gray-800">
                Step 2: Opt-In Confirmation
              </h2>
              <p>
                To comply with industry standards and ensure client consent, an
                automated opt-in message is sent to the provided phone number:
              </p>
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                “RebusPro: Reply ‘Y’ to subscribe to automated event reminders.
                Reply ‘N’ to not receive event reminders. Msg. & data rates
                apply.”
              </blockquote>

              <Image
                src={subscribe}
                alt="Text Messaging Opt-In Workflow"
                width={800}
                height={600}
                className="mx-auto mt-8"
              ></Image>

              <h2 className="text-2xl font-semibold mt-8 text-gray-800">
                Step 3: Opt-In Success
              </h2>
              <p>
                If the client replies with <strong>“Y”</strong>, they will
                receive the following confirmation message:
              </p>
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                “You have subscribed to RebusPro event reminders. Reply ‘Stop’
                to unsubscribe.”
              </blockquote>
              <p>
                Once the client successfully opts in, their account in RebusPro
                will automatically update, enabling them to receive event
                reminders.
              </p>

              <h2 className="text-2xl font-semibold mt-8 text-gray-800">
                Event Reminder Notifications
              </h2>
              <p>
                Clients who have opted in will receive a text message reminder{" "}
                <strong>one day before their scheduled event</strong>. The
                reminder will include personalized details, such as the session
                type, time, and other relevant information.
              </p>
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                “Remindar from Rebuspro: you have an appointment at 8:00
                tomorrow [Dec 9th]. Reply Stop to unsubscribe”
              </blockquote>

              <Image
                src={reminder}
                alt="Text Messaging Opt-In Workflow"
                width={800}
                height={600}
                className="mx-auto mt-8"
              ></Image>

              <h2 className="text-2xl font-semibold mt-8 text-gray-800">
                Opt-Out Option
              </h2>
              <p>
                At any time, clients can choose to stop receiving reminders by
                replying with <strong>“Stop”</strong>. Upon receiving this
                response:
              </p>
              <ul className="list-disc pl-6">
                <li>
                  RebusPro will immediately stop sending event reminders to the
                  client.
                </li>
                <li>
                  The client’s account will automatically update to reflect
                  their decision.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 text-gray-800">
                Workflow Summary
              </h2>
              <ol className="list-decimal pl-6">
                <li>Phone number is added to the client account.</li>
                <li>Client receives an opt-in confirmation text.</li>
                <li>
                  Client replies <strong>“Y”</strong> to subscribe or{" "}
                  <strong>“N”</strong> to decline.
                </li>
                <li>
                  Subscribed clients receive reminders one day before events.
                </li>
                <li>
                  Clients can unsubscribe anytime by replying{" "}
                  <strong>“Stop”</strong>, which disables future reminders.
                </li>
              </ol>

              <p className="mt-8">
                <strong>Empowering Our Clients:</strong> RebusPro is committed
                to providing flexibility and respect for client preferences. Our
                opt-in workflow ensures compliance, transparency, and
                convenience, helping clients stay organized without compromising
                their choice or comfort.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
