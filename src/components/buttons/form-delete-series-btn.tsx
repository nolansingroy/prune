import React from "react";
import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type FormButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export default function FormDeleteSeriesButton({
  children,
  className,
  onClick,
}: FormButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      onClick={onClick}
      disabled={pending}
      variant="destructive"
      className={cn("", className)}
    >
      {children}
    </Button>
  );
}