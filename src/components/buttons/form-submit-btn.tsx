import React from "react";
import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type FormButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export default function FormSubmitButton({
  children,
  className,
}: FormButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      variant="rebusPro"
      // size="sm"
      className={cn("", className)}
    >
      {children}
    </Button>
  );
}
