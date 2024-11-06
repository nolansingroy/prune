import { Metadata } from "next";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import AvailabilityView from "./_components/availability-view";

export default function Page() {
  const title = "My available times";
  const description = "Manage your available times here.";
  return (
    <PageContainer scrollable={false}>
      <div className="space-y-4">
        <Heading title={title} description={description} />
        <Separator />
        <AvailabilityView />
      </div>
    </PageContainer>
  );
}
