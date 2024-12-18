"use client";

import ClientSmsForm from "@/components/forms/client-sms-form";
import { SendHorizontal } from "lucide-react";
import {
  TSMSForm,
  smsDataSchema,
} from "@/lib/validations/sms-form-validations";
import { useRouter, useSearchParams, notFound } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function SmsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("user");
  const clientId = searchParams.get("client");

  console.log("coach id:", userId);
  console.log("client id: ", clientId);

  const [clientData, setClientData] = useState<TSMSForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!userId || !clientId) {
        setLoading(false);
        router.push("/404");
        return;
      }

      try {
        const clientDoc = await getDoc(
          doc(db, `users/${userId}/clients/${clientId}`)
        );
        if (clientDoc.exists()) {
          console.log("Client data:", clientDoc.data());
          setClientData(clientDoc.data() as TSMSForm);
        } else {
          console.error("Client data not found");
        }
      } catch (error) {
        console.error("Error getting client data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [userId, clientId]);

  const handleSubmit = async (data: TSMSForm) => {
    console.log(data);
    // const response = await call cloud function
    // if (!!response.error || !response.propertyId) {
    //   toast.error(`Error: ${response.message}`);
    //   return;
    // }
    // logic here
    // after logic display success message
    // toast.success("Sucssefully subscribed to sms service");
    //push to success page
    // router.push("/success-sms");
  };

  if (loading) {
    return <div>Loading...</div>;
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
      />
    </div>
  );
}
