"use client";

import { useEffect, useRef } from "react";

/** Reports rendered height to the parent page so embed.js can size the iframe. */
export function EmbedAutoHeight({ publicId }: { publicId: string }) {
  const sent = useRef(0);

  useEffect(() => {
    if (window.parent === window) return;
    const post = () => {
      const height = Math.ceil(document.documentElement.scrollHeight);
      if (height === sent.current) return;
      sent.current = height;
      window.parent.postMessage({ type: "sdn-embed-height", publicId, height }, "*");
    };
    post();
    const observer = new ResizeObserver(post);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, [publicId]);

  return null;
}
