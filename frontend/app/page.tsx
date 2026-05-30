import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "ReelCraft — Viral Reels in 60 Seconds | AI Video Creator for India",
  description:
    "AI-powered short video creation for Indian content creators. Type a prompt, get a viral reel in 60 seconds. Hindi, English, Hinglish, Kannada supported.",
  keywords: "AI video, reels creator, Hindi content, viral reels, Instagram reels, YouTube Shorts",
};

export default function LandingPage() {
  return <LandingClient />;
}
