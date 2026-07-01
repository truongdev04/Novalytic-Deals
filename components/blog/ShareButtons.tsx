"use client";

import { Link2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";
import { FacebookIcon, TwitterIcon } from "@/components/ui/SocialIcons";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const shareLinks = [
    {
      name: "Twitter",
      icon: TwitterIcon,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-600">Share:</span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${link.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 text-muted-600 hover:bg-brand-50 hover:text-brand-700"
        >
          <link.icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 text-muted-600 hover:bg-brand-50 hover:text-brand-700"
      >
        <Link2 className="h-4 w-4" />
      </button>
    </div>
  );
}
