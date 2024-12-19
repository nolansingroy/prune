import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function SubscriptionSuccessPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <CardTitle className="text-2xl font-bold">
              Subscription Successful!
            </CardTitle>
          </div>
          <CardDescription>
            You&apos;re now subscribed to RebusPro booking reminders SMS
            service.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You&apos;ll receive SMS reminders for your upcoming bookings. Stay
            tuned for important updates and never miss an appointment!
          </p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Timely reminders at 8:00 AM the day before you bookings</li>
            <li>Easy opt-out option in every message</li>
          </ul>
        </CardContent>
        {/* <CardFooter>
          <Button asChild className="w-full">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </CardFooter> */}
      </Card>
    </div>
  );
}
