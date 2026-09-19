import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { findSessionByToken } from "@/lib/sessions";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get("ch_session")?.value;
  if (!token) {
    redirect("/login?redirect=/portal/iron-master");
  }

  // Note: we don't await here to keep layout sync; child pages verify too
  return <>{children}</>;
}