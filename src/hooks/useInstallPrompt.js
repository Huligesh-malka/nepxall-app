import { useEffect, useState } from "react";

export const useInstallPrompt = () => {
  const [installable, setInstallable] = useState(false);
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // stop auto popup
      console.log("✅ Install prompt captured");

      setPromptEvent(e);
      setInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const installApp = async () => {
    if (!promptEvent) return;

    promptEvent.prompt();

    const choice = await promptEvent.userChoice;
    console.log("User choice:", choice.outcome);

    setPromptEvent(null);
    setInstallable(false);
  };

  return { installable, installApp };
};