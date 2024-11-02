import { Metadata } from "next";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  const title = "My available times";
  const description = "Manage your available times here.";
  return (
    <PageContainer>
      <div className="space-y-4 mb-5">
        <Heading title={title} description={description} />
        <Separator />
        {/* <BookTypesView /> */}
      </div>
    </PageContainer>
  );
}
