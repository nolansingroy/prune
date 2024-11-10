import { Metadata } from "next";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import ClientsView from "./_components/clients-view";

export default function Page() {
  const title = "Clients";
  const description = "Manage your clients here.";
  return (
    <PageContainer>
      <div className="space-y-4 mb-5">
        <Heading title={title} description={description} />
        <Separator />
        <ClientsView />
      </div>
    </PageContainer>
  );
}
