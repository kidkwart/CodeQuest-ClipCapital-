import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyMessages, useSendMessageToAdmin } from "@/lib/app-queries";
import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, ShieldCheck, Loader2, Info, ChevronRight, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/app/support")({
  component: SupportPage,
});

function SupportPage() {
  const { data: messages, isLoading } = useMyMessages();
  const sendMessage = useSendMessageToAdmin();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('support-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_messages' }, () => {
        qc.invalidateQueries({ queryKey: ["admin-messages"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

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

  const faqs = [
    { q: "How do I apply for a loan?", a: "Go to the Loans page, enter amount and term, and click Submit. Your limit grows with your score." },
    { q: "How do I pay back my loan?", a: "Go to Loans, click 'Pay Now' on an active loan, and use Mobile Money via Paystack." },
    { q: "What is ClipSusu?", a: "A community savings group where members rotate payouts. Safe and transparent." },
  ];

  return (
    <AppShell title="Support Center">
      <div className="space-y-6 max-w-4xl mx-auto pb-20">

        {/* Urgent Contact & FAQs */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Info className="w-5 h-5 text-primary" />
              <div className="font-bold text-sm">Emergency Support</div>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">Urgent payment issue? Contact us instantly via WhatsApp.</p>
            <Button
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-10 text-xs gap-2"
              onClick={() => window.open('https://wa.me/233509511256', '_blank')}
            >
              <MessageCircle className="w-4 h-4" /> Message on WhatsApp
            </Button>
          </Card>

          <div className="space-y-2">
            {faqs.map((f, i) => (
              <div key={i} className="bg-surface border border-border p-3 rounded-xl">
                <div className="text-[11px] font-bold leading-none mb-1">{f.q}</div>
                <p className="text-[10px] text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Chat Area */}
        <div className="flex flex-col h-[500px]">
          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-border/50 shadow-lg bg-surface/50 backdrop-blur-sm">
            <div className="p-3 border-b border-border bg-muted/20 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="font-bold text-xs">Official ClipCapital Support</div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary/50" /></div>
              ) : (messages ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                  <MessageCircle className="w-10 h-10 mb-2" />
                  <p className="text-xs font-bold uppercase">No message history</p>
                </div>
              ) : (
                messages!.map((m) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    key={m.id}
                    className={cn("flex flex-col max-w-[85%]", m.is_from_admin ? "self-start" : "self-end items-end")}
                  >
                    <div className={cn(
                      "px-3 py-2 rounded-2xl text-[13px] shadow-sm font-medium",
                      m.is_from_admin ? "bg-white border text-foreground rounded-tl-none" : "bg-primary text-white rounded-tr-none"
                    )}>
                      {m.message}
                    </div>
                    <span className="text-[8px] text-muted-foreground mt-1 font-black uppercase px-1">
                      {m.is_from_admin ? 'Support' : 'You'} · {format(new Date(m.created_at), "h:mm a")}
                    </span>
                  </motion.div>
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-border bg-white flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your question..."
                className="rounded-xl h-10 border-border/50 bg-muted/20 text-sm"
                disabled={sendMessage.isPending}
              />
              <Button type="submit" size="icon" className="h-10 w-10 rounded-xl shadow-lg" disabled={sendMessage.isPending || !text.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
