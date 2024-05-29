// PasswordResetDialog.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PasswordResetDialogProps {
  onClose: () => void; // Callback to close the dialog
}

export function PasswordResetDialog({ onClose }: PasswordResetDialogProps) {
  const [email, setEmail] = useState("");

  const handleResetClick = async () => {
    // Implement your password reset logic here
    // Call your resetPassword function with the user's email
    // Example: await resetPassword(email, auth);
    console.log("Initiating password reset for email:", email);
    onClose(); // Close the dialog after initiating the reset
  };

  return (
    <Dialog>
      {/* Remove the DialogTrigger and Button */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Forgot Password</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleResetClick}>Reset Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
