import { Metadata } from "next";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import BookingsView from "./_components/bookings-view";

export default function Page() {
  const title = "My bookings";
  const description = "Manage your bookings here.";
  return (
    <PageContainer scrollable={false}>
      <div className="space-y-4">
        <Heading title={title} description={description} />
        <Separator />
        <BookingsView />
      </div>
    </PageContainer>
  );
}
