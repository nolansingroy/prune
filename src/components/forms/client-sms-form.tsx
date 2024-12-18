import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { PhoneInput } from "@/components/ui/phone-input";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  TSMSForm,
  smsDataSchema,
} from "../../lib/validations/sms-form-validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Image from "next/image";
import { loginLogoLight } from "../../../public";

type Props = {
  submitButtonLabel: React.ReactNode;
  handleSubmit: (data: TSMSForm) => void;
  defaultValues?: TSMSForm;
};

export default function ClientSmsForm({
  handleSubmit,
  submitButtonLabel,
  defaultValues,
}: Props) {
  const combinedDefaultValues: TSMSForm = {
    ...{
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      acceptSmsNotifications: false, // Add default value for acceptSmsNotifications
    },
    ...defaultValues,
  };

  const form = useForm<TSMSForm>({
    resolver: zodResolver(smsDataSchema),
    defaultValues: combinedDefaultValues,
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="flex justify-center items-center gap-2">
        <Image src={loginLogoLight} alt="Logo" width={180} height={180}></Image>
      </div>

      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>SMS Subscription</CardTitle>
          <CardDescription>
            Before proceeding, please ensure your information is accurate and
            confirm your agreement to receive SMS notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="gap-4">
              <fieldset
                className="flex flex-col gap-2"
                disabled={form.formState.isSubmitting}
              >
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput
                          defaultCountry="US"
                          id="phoneNumber"
                          {...field}
                          onChange={(value) => field.onChange(value)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="acceptSmsNotifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex items-center space-x-2 mt-4">
                          <Input
                            type="checkbox"
                            id="acceptSmsNotifications"
                            {...field}
                            className="w-6 h-6"
                            value={String(field.value)} // Convert boolean to string
                          />
                          <FormLabel
                            htmlFor="acceptSmsNotifications"
                            className="ml-2 text-lg"
                          >
                            I accept to receive SMS notifications
                          </FormLabel>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>

              <Button
                type="submit"
                className="max-w-md mx-auto mt-10 w-full flex gap-2"
                disabled={form.formState.isSubmitting}
              >
                {submitButtonLabel}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
