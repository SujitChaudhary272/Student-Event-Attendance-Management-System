import { useEffect, useRef } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-service";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
    document.head.appendChild(script);
  });
}

export default function GoogleAuthButton({
  text = "signin_with",
  onCredential,
  disabled = false,
}) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;

    async function renderGoogleButton() {
      if (!GOOGLE_CLIENT_ID || disabled || !buttonRef.current) {
        return;
      }

      try {
        await loadGoogleScript();
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) {
              onCredentialRef.current?.(response.credential);
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          width: 320,
        });
      } catch (error) {
        if (!cancelled && buttonRef.current) {
          buttonRef.current.innerHTML =
            '<div class="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-500">Google Sign-In is unavailable.</div>';
        }
      }
    }

    renderGoogleButton();

    return () => {
      cancelled = true;
    };
  }, [disabled, text]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Google Sign-In is disabled until `VITE_GOOGLE_CLIENT_ID` is configured.
      </div>
    );
  }

  return <div ref={buttonRef} className={disabled ? "pointer-events-none opacity-60" : ""} />;
}
