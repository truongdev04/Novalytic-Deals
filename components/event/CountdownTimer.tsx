"use client";

import { useEffect, useState } from "react";

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endsAt));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(endsAt)), 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (!timeLeft) {
    return <p className="font-heading text-lg font-semibold text-white">This event has ended</p>;
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-3" role="timer" aria-live="off">
      {units.map((unit) => (
        <div
          key={unit.label}
          className="flex min-w-16 flex-col items-center rounded-lg bg-white/15 px-3 py-2 backdrop-blur"
        >
          <span className="font-heading text-2xl font-bold text-white tabular-nums">
            {String(unit.value).padStart(2, "0")}
          </span>
          <span className="text-xs text-white/80">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
