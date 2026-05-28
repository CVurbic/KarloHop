import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";

const AVATAR_SRC = "/assets/ZEKO%209.1.png";
const AVATAR_FALLBACK = "/assets/rezervacije-2.webp";
const PHONE_DISPLAY = "095 865 5213";
const WHATSAPP_URL =
  "https://wa.me/385958655213?text=" +
  encodeURIComponent("Pozdrav! Zanima me najam napuhanca.");

const GREETING =
  "Bok! Ja sam Mr. Hop 🐰 Pomažem oko napuhanaca — dostave, prostora, termina i rezervacija. Kako vam mogu pomoći?";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Treat Netlify deploy previews, *.netlify.app and localhost as non-production. */
function isPreviewEnv(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.endsWith(".netlify.app") ||
    h.includes("deploy-preview") ||
    h.includes("--")
  );
}

function Avatar({ className }: { className?: string }) {
  const [src, setSrc] = useState(AVATAR_SRC);
  return (
    <img
      src={src}
      alt="Mr. Hop"
      className={className}
      onError={() => src !== AVATAR_FALLBACK && setSrc(AVATAR_FALLBACK)}
      loading="lazy"
    />
  );
}

const MrHopChat = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: GREETING },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (open) {
      analytics.trackChatOpen();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setIsLoading(true);

    // Anthropic requires the history to start with a user turn, so drop the
    // local greeting (and any leading assistant messages) before sending.
    const apiMessages = next.filter(
      (_, i) => !(i === 0 && next[0].role === "assistant"),
    );

    try {
      const { data, error } = await supabase.functions.invoke("mr-hop-chat", {
        body: { messages: apiMessages, isPreview: isPreviewEnv() },
      });

      if (error) throw error;

      const reply: string =
        data?.reply ||
        "Ispričavam se, nešto je pošlo po zlu. Pokušajte ponovno ili nas nazovite na " +
          PHONE_DISPLAY +
          ".";

      setMessages((m) => [...m, { role: "assistant", content: reply }]);

      if (data?.bookingCreated) {
        const b = data.bookingCreated;
        analytics.trackChatBooking(
          b?.selected_bounce_house || "",
          b?.booking_start_date || "",
        );
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Ispričavam se, trenutno ne mogu odgovoriti. Molim pokušajte ponovno za koji trenutak ili nas nazovite na " +
            PHONE_DISPLAY +
            ".",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating launcher (replaces the WhatsApp button) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-white border-2 border-primary p-1 group"
          aria-label="Otvori razgovor s Mr. Hopom"
        >
          <Avatar className="h-14 w-14 rounded-full object-cover" />
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white" />
          <span className="absolute right-full mr-3 bg-foreground text-background px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Pitajte Mr. Hopa
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:bottom-6 sm:right-6 flex flex-col bg-card shadow-2xl border border-border sm:rounded-2xl overflow-hidden w-full sm:w-[380px] h-[80vh] sm:h-[600px] max-h-screen">
          {/* Header */}
          <div className="gradient-primary text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <Avatar className="h-10 w-10 rounded-full object-cover bg-white/20 border border-white/40" />
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-tight">Mr. Hop</p>
              <p className="text-xs text-white/90 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-300 inline-block" />
                Tu sam za vaša pitanja
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Zatvori razgovor"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-muted/20">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <Avatar className="h-7 w-7 rounded-full object-cover mr-2 mt-1 shrink-0" />
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Avatar className="h-7 w-7 rounded-full object-cover mr-2 mt-1 shrink-0" />
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1">
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Talk to a human */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analytics.trackWhatsAppClick()}
            className="shrink-0 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary py-2 border-t border-border transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            Razgovaraj s osobom — {PHONE_DISPLAY} / WhatsApp
          </a>

          {/* Input */}
          <div className="shrink-0 p-3 border-t border-border flex items-center gap-2 bg-card">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={1000}
              placeholder="Napišite poruku..."
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="gradient-primary text-white rounded-full p-2.5 disabled:opacity-50 transition-opacity hover:shadow-playful shrink-0"
              aria-label="Pošalji poruku"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MrHopChat;
