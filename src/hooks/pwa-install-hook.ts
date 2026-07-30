"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const checkIfInstalled = () => {
  if (typeof window === "undefined") return false;

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = !!(window.navigator as any).standalone;
  const isLaunchedFromHomeScreen = document.referrer.includes("android-app://");
  const isFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
  const isWcoVisible = !!(window.navigator as any).windowControlsOverlay?.visible;

  const installed =
    isStandalone ||
    isIOSStandalone ||
    isLaunchedFromHomeScreen ||
    (isFullscreen && !window.matchMedia("(display-mode: browser)").matches) ||
    isWcoVisible;

  return installed;
};

const showManualInstallInstructions = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

  let instructions = "";

  if (isIOS) {
    instructions =
      "To install this app on your iOS device:\n\n" +
      "1. Tap the Share button (square with arrow) at the bottom\n" +
      "2. Scroll down and tap 'Add to Home Screen'\n" +
      "3. Tap 'Add' to confirm\n\n" +
      "After installation, you can find the app on your home screen.";
  } else if (isAndroid) {
    if (isChrome) {
      instructions =
        "To install this app on your Android device:\n\n" +
        "1. Look for the install icon in the address bar (or tap the menu)\n" +
        "2. Tap 'Install' or 'Add to Home screen'\n" +
        "3. Tap 'Install' in the popup to confirm\n\n" +
        "The install icon appears when the app is installable.";
    } else {
      instructions =
        "To install this app on your Android device:\n\n" +
        "1. Tap the menu (three dots) in your browser\n" +
        "2. Tap 'Add to Home screen' or 'Install app'\n" +
        "3. Tap 'Install' to confirm";
    }
  } else if (isEdge) {
    instructions =
      "To install this app:\n\n" +
      "1. Look for the install icon (+) in the address bar\n" +
      "2. Click it and then click 'Install'\n\n" +
      "Or use the menu (three dots) > Apps > Install this site as an app";
  } else if (isSafari) {
    instructions =
      "To install this app on Safari:\n\n" +
      "1. Click File > Add to Dock (Mac)\n" +
      "2. Or use the Share menu to add to home screen (iOS)\n\n" +
      "Note: Full PWA support may be limited on Safari.";
  } else {
    instructions =
      "To install this app:\n\n" +
      "Look for the install icon in your browser's address bar, " +
      "or use your browser's menu to find 'Install' or 'Add to Home Screen'.\n\n" +
      "The exact steps vary by browser.";
  }

  alert(instructions);
};

export const usePWAInstall = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return checkIfInstalled();
  });

  const install = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setIsOpen(false);
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (error) {
        showManualInstallInstructions();
      }
    } else {
      showManualInstallInstructions();
    }
  };

  const close = () => {
    setIsOpen(false);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  useEffect(() => {
    const initialCheck = checkIfInstalled();
    if (initialCheck) {
      setIsInstalled(true);
      setIsOpen(false);
      return;
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js", { scope: "/" })
        .then((_) => {})
        .catch((error) => {
          console.warn("Service Worker registration failed:", error);
        });
    }

    const checkInstallation = () => {
      const installed = checkIfInstalled();
      setIsInstalled(installed);
      if (installed) setIsOpen(false);
      return installed;
    };

    const installed = checkInstallation();
    const earlyPrompt = (window as any).__PWA_INSTALL_PROMPT;
    if (earlyPrompt) setDeferredPrompt(earlyPrompt);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      (window as any).__PWA_INSTALL_PROMPT = promptEvent;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt, { once: false });

    if (!installed) {
      const timer = setTimeout(() => {
        const stillNotInstalled = !checkInstallation();
        if (!stillNotInstalled) return;
        const dismissedThisSession = sessionStorage.getItem("pwa-install-dismissed");
        if (!dismissedThisSession) setIsOpen(true);
      }, 3000);

      const checkInstallationStatus = () => {
        const currentlyInstalled = checkInstallation();
        if (currentlyInstalled) return setIsOpen(false);
        const dismissedThisSession = sessionStorage.getItem("pwa-install-dismissed");
        if (!dismissedThisSession && !isOpen) setIsOpen(true);
      };

      const checkInterval = setInterval(checkInstallationStatus, 2000);
      document.addEventListener("visibilitychange", checkInstallationStatus);
      window.addEventListener("focus", checkInstallationStatus);

      return () => {
        clearTimeout(timer);
        clearInterval(checkInterval);
        document.removeEventListener("visibilitychange", checkInstallationStatus);
        window.removeEventListener("focus", checkInstallationStatus);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isOpen]);

  return { isOpen, isInstalled, close, install };
};
