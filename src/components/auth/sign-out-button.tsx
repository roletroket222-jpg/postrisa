import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/auth/actions";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <Button size="sm" variant="outline">
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </form>
  );
}
