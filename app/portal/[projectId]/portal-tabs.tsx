"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Clock, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/i18n/context";

/**
 * Client-side tab controller for the portal so external banners (like the
 * default password warning) can switch directly to the Settings tab.
 */
export function PortalTabs({
  timelineContent,
  settingsContent,
}: {
  timelineContent: ReactNode;
  settingsContent: ReactNode;
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"timeline" | "settings">("timeline");

  useEffect(() => {
    if (window.location.hash === "#settings") {
      setActiveTab("settings");
    }
    const handleOpenSettings = () => setActiveTab("settings");
    window.addEventListener("portal:open-settings", handleOpenSettings);
    return () => window.removeEventListener("portal:open-settings", handleOpenSettings);
  }, []);

  return (
    <div id="portal-tabs" className="mt-8">
      <Tabs
        defaultValue="timeline"
        value={activeTab}
        onValueChange={(v) => setActiveTab(v === "settings" ? "settings" : "timeline")}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="timeline" className="gap-2">
            <Clock size={14} />
            {t("portal.tabs.timeline")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings size={14} />
            {t("portal.tabs.settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">{timelineContent}</TabsContent>
        <TabsContent value="settings">{settingsContent}</TabsContent>
      </Tabs>
    </div>
  );
}
