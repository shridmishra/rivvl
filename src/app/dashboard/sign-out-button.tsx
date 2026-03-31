"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 text-slate-600 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
