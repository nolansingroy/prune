import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";
import ProfileView from "./_components/profile-view";
import { getDecodedToken } from "@/lib/helpers/tokens";

export default async function Page() {
  const tokens = await getDecodedToken();

  const title = "Profile Settings";
  const description = "Update your profile settings here.";
  return (
    <PageContainer>
      <div className="space-y-4 mb-5">
        <Heading title={title} description={description} />
        <Separator />
        <ProfileView />
      </div>
    </PageContainer>
  );
}
