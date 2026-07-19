"use client";

import React from "react";
import { Spinner } from "@heroui/react";

export const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      <Spinner />
    </div>
  );
};
