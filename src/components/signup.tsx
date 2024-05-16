import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Signup() {
  return (
    <div className="flex w-full max-w-sm items-center space-x-2 bg-custom-purple text-black">
      <Input
        type="email"
        placeholder="Email"
        style={{ backgroundColor: "white" }}
      />
      <Button type="submit">Sign Up</Button>
    </div>
  );
}

export default Signup;
