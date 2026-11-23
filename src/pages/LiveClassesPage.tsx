// src/pages/LiveClassesPage.tsx
import React from "react";
import { LiveClassList } from "../components/live/LiveClassList";

export const LiveClassesPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Live Classes</h1>
      <p className="text-sm text-slate-500">
        Scheduled Zoom classes for the courses allocated to you. Times are in IST.
      </p>
    </div>
    <LiveClassList />
  </div>
);
