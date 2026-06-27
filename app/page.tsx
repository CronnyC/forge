export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingClient from "./landing/LandingClient";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.onboarded_at) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  // Public landing page for unauthenticated visitors
  return <LandingClient />;
}
