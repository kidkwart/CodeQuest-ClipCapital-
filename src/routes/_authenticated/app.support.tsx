import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyMessages, useSendMessageToAdmin } from "@/lib/app-queries";
import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, User, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/app/support")({
  component: SupportPage,
});

function SupportPage() {
  const { data: messages, isLoading } = useMyMessages();
  const sendMessage = useSendMessageToAdmin();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await sendMessage.mutateAsync(text);
      setText("");
    } catch (e) {}
  }

  return (
    <AppShell title="Support Chat">
      <div className="max-w-3xl mx-auto h-[calc(100vh-180px)] flex flex-col">
        <Card className="flex-1 flex flex-col p-0 overflow-hidden border-border/50 shadow-xl">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm">ClipCapital Support</div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Online & Ready to Help</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 scroll-smooth"
          >
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
              </div>
            ) : (messages ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-10">
                <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-primary/20" />
                </div>
                <h3 className="font-bold text-muted-foreground">No messages yet</h3>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Have a question about your loan or a product? Send a message to our team below.
                </p>
              </div>
            ) : (
              messages!.map((m) => (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={m.id}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    m.is_from_admin ? "self-start" : "self-end items-end"
                  )}
                >
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                    m.is_from_admin
                      ? "bg-surface-elevated border border-border text-foreground rounded-tl-none"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  )}>
                    {m.message}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 font-bold uppercase px-1">
                    {m.is_from_admin ? 'Admin' : 'You'} • {format(new Date(m.created_at), "h:mm a")}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-border bg-background flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your question here..."
              className="rounded-xl h-11 border-border/50 focus:ring-1 focus:ring-primary outline-none"
              disabled={sendMessage.isPending}
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 rounded-xl shadow-lg shadow-primary/20"
              disabled={sendMessage.isPending || !text.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
          Secure end-to-end communication with ClipCapital Ltd.
        </p>
      </div>
    </AppShell>
  );
}
