import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function SubscriptionUnsuccessfulPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <XCircle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-2xl font-bold">
              Subscription Unsuccessful
            </CardTitle>
          </div>
          <CardDescription>
            Thank you for updating your information, but we couldn&apos;t
            complete your subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Unfortunately, your subscription to the RebusPro booking reminders
            SMS service was not successful because you didn&apos;t agree to the
            terms and conditions.
          </p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Kinday go back and agree on terms and policy to subscribe </li>
          </ul>
        </CardContent>
        {/* <CardFooter>
          <Button asChild className="w-full">
            <Link href="/subscribe">Go Back and Agree to Terms</Link>
          </Button>
        </CardFooter> */}
      </Card>
    </div>
  );
}
