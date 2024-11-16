import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function PageContainer({
  children,
  scrollable = true,
  className,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className="h-[calc(100dvh-52px)]">
          <div className={cn("h-full  p-4 md:px-8", className)}>{children}</div>
        </ScrollArea>
      ) : (
        <div className={cn("h-full  p-4 md:px-8", className)}>{children}</div>
      )}
    </>
  );
}
