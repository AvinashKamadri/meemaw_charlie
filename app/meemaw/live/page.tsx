"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MeemawLivePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/meemaw");
  }, [router]);

  return null;
}
