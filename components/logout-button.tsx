"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-muted-foreground hover:text-foreground" 
      onClick={handleLogout}
      title="Log out"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
