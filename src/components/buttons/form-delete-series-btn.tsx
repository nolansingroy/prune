import React from "react";
import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type FormButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
};

export default function FormDeleteSeriesButton({
  children,
  className,
  onClick,
  isLoading,
}: FormButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={pending || isLoading}
      variant="destructive"
      className={cn("", className)}
    >
      {children}
    </Button>
  );
}
