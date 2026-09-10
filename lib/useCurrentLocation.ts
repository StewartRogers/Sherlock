"use client";

import { useEffect, useRef, useState } from "react";
import { nearestJobsite } from "./data";

/**
 * "Use my location" for an address field: reads the device position and hands
 * the nearest known jobsite's address to `onFound`. Shared by the New casefile
 * screen and the Profile tab so both report failures the same way.
 */
export function useCurrentLocation(onFound: (address: string) => void) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  /* The lookup has a 10s timeout, so it can still be in flight when the
     inspector leaves the screen. Its callbacks check this first rather than
     writing state for a screen that is gone. */
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  function locate() {
    if (!("geolocation" in navigator)) {
      setLocateError("Location services aren't available on this device.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!live.current) return;
        const site = nearestJobsite(pos.coords.latitude, pos.coords.longitude);
        if (site) onFound(site.address);
        else setLocateError("No known jobsite is near you — enter the address manually.");
        setLocating(false);
      },
      (err) => {
        if (!live.current) return;
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied — enter the address manually."
            : "Couldn't get your location — enter the address manually.",
        );
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }

  return { locating, locateError, locate };
}
