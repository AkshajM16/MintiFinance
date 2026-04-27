import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { getAuthHeaders } from "@/services/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  userId: string;
}

const QUICK_PROMPTS = [
  "How am I doing this month?",
  "What should I watch out for?",
  "How can I save more?",
];

export function ChatBot({ userId }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hey, I am Larry the Llama. Ask me anything about your finances.",
    },
  ]);

  const sendMessage = async (message: string) => {
    const nextUserMessage: ChatMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, nextUserMessage, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          messages: [...messages, nextUserMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to send message");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const clone = [...prev];
          clone[clone.length - 1] = { role: "assistant", content: accumulated };
          return clone;
        });
      }
    } catch (error) {
      setMessages((prev) => {
        const clone = [...prev];
        clone[clone.length - 1] = {
          role: "assistant",
          content: "I ran into an issue while generating advice. Please try again.",
        };
        return clone;
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-2xl shadow-lg"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open Larry chatbot"
      >
        🦙
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 right-5 w-[400px] max-w-[calc(100vw-2rem)] h-[500px] z-50 glass bg-gray-900/95 border border-gray-700 rounded-2xl p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold">Larry the Llama</p>
                <p className="text-xs text-gray-400">AI financial advisor</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap mb-3">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  className="text-xs px-2 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-200"
                  onClick={() => sendMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white ml-8"
                      : "bg-gray-800 text-gray-100 mr-8"
                  }`}
                >
                  {message.content || (loading && index === messages.length - 1 ? "Larry is typing..." : "")}
                </div>
              ))}
            </div>

            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = input.trim();
                if (!trimmed || loading) return;
                sendMessage(trimmed);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                placeholder="Ask Larry..."
              />
              <Button type="submit" disabled={loading}>
                Send
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
