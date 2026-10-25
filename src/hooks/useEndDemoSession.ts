"use client";

import { useRouter } from "next/navigation";
import { useAnnounce } from "@/context/AnnouncerContext";
import { useDemoAccount } from "@/context/DemoAccountContext";

/** "Log out" of the demo account: ends the demo session and opens the sign-in page with a notice. */
export function useEndDemoSession() {
  const router = useRouter();
  const announce = useAnnounce();
  const { endDemoSession } = useDemoAccount();
  return () => {
    endDemoSession();
    announce("You have left the demo account.");
    router.push("/login?signed_out=1");
  };
}
