"use client";

import { useCallback, useEffect, useState } from "react";
import ClientSmsForm from "@/components/forms/client-sms-form";
import { SendHorizontal } from "lucide-react";
import {
  TSMSForm,
  smsDataSchema,
} from "@/lib/validations/sms-form-validations";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import axios from "axios";
import { cloudFunctions } from "@/constants/data";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function SmsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("user");
  const clientId = searchParams.get("client");
  const token = searchParams.get("token");

  console.log("coach id:", userId);
  console.log("client id: ", clientId);

  const [clientData, setClientData] = useState<TSMSForm | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClientData = useCallback(async () => {
    if (!userId || !clientId || !token) {
      setLoading(false);
      router.push("/404");
      return;
    }

    try {
      const response = await axios.get(cloudFunctions.fetchClientDataTest, {
        params: { userId, clientId, token },
      });
      console.log("response:", response.data);
      setClientData(response.data);
    } catch (error) {
      console.error("Error getting client data:", error);
      setLoading(false);
      router.push("/404");
    } finally {
      setLoading(false);
    }
  }, [userId, clientId, token, router]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const handleSubmit = async (data: TSMSForm) => {
    console.log(data);

    // const response = await call cloud function
    // if (!!response.error || !response.propertyId) {
    //   toast.error(`Error: ${response.message}`);
    //   return;
    // }
    // logic here
    // after logic display success message
    // toast.success("Successfully subscribed to sms service");
    // push to success page
    // router.push("/success-sms");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <ClientSmsForm
        handleSubmit={handleSubmit}
        submitButtonLabel={
          <>
            <SendHorizontal />
            <span>Submit</span>
          </>
        }
        defaultValues={clientData || undefined} // Pass undefined if clientData is null
      />
    </div>
  );
}