import { Metadata } from "next";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import BookTypesView from "./_components/book-types-view";

export default function Page() {
  const title = "Booking Types";
  const description = "Manage your booking types here.";
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Heading title={title} description={description} />
        <Separator />
        <BookTypesView />
      </div>
    </PageContainer>
  );
}
