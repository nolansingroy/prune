import { Metadata } from "next";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import AvailabilityView from "./availability-view";

export default function AvailabilityListviewPage() {
  const title = "My available times";
  const description = "Manage your available times here.";
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start">
          <Heading title={title} description={description} />
        </div>
        <Separator />
        <AvailabilityView />
      </div>
    </PageContainer>
  );
}
