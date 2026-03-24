"use client";

import { VHSHeader } from "@/components/VHSHeader";
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <VHSHeader />
      <ChatInterface />
    </div>
  );
}
