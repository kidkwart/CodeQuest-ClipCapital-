import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyMessages, useSendMessageToAdmin } from "@/lib/app-queries";
import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, ShieldCheck, Loader2, Info, ChevronRight, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    // Real-time subscription for support messages
    const channel = supabase
      .channel('support-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages'
        },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    { q: "How do I apply for a loan?", a: "Go to the Loans & Credit page, enter your desired amount and term, and click Submit. Your ClipScore determines your limit." },
    { q: "What is ClipSusu?", a: "ClipSusu is our community savings feature where you can save with fellow barbers and hairdressers to get large lump sums." },
    { q: "How is my ClipScore calculated?", a: "Your score grows as you log daily income, pay back loans on time, and make consistent Susu contributions." },
    { q: "Can I buy clippers on credit?", a: "Yes! Use the ClipMarket and select 'Buy Now, Pay Later' at checkout to add the item to your loan balance." }
  ];

  return (
    <AppShell title="Support & Help">
      <div className="grid lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
        <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
          <div>
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Frequently Asked
            </h3>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <Card key={i} className="p-4 hover:border-primary/30 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start gap-3">
                    <div className="text-sm font-bold leading-tight">{f.q}</div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{f.a}</p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Info className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm">Emergency Support</div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">If you have an urgent issue with a payment, you can also reach us via WhatsApp.</p>
            <Button
              variant="outline"
              className="w-full font-bold h-10 text-xs border-primary/30 text-primary hover:bg-primary hover:text-white transition-all"
              onClick={() => window.open('https://wa.me/233509511256', '_blank')}
            >
              Message on WhatsApp
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col h-full">
          <Card className="flex-1 flex flex-col p-0 overflow-hidden border-border/50 shadow-xl bg-surface/50 backdrop-blur-sm">
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm">ClipCapital Direct Chat</div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Support Agent Online</span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/5 scroll-smooth"
            >
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
                </div>
              ) : (messages ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-10">
                  <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-4 border border-primary/10">
                    <MessageCircle className="w-10 h-10 text-primary/20" />
                  </div>
                  <h3 className="font-black text-foreground text-lg uppercase tracking-tight">How can we help?</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                    Our team is here to support your business growth. Send us a message anytime!
                  </p>
                </div>
              ) : (
                messages!.map((m) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={m.id}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      m.is_from_admin ? "self-start" : "self-end items-end"
                    )}
                  >
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm shadow-sm font-medium leading-relaxed",
                      m.is_from_admin
                        ? "bg-white border border-border/60 text-foreground rounded-tl-none shadow-black/[0.02]"
                        : "bg-primary text-white rounded-tr-none shadow-primary/10"
                    )}>
                      {m.message}
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1.5 font-black uppercase px-1 tracking-tighter opacity-70">
                      {m.is_from_admin ? 'Official Support' : 'You'} · {format(new Date(m.created_at), "h:mm a")}
                    </span>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-border bg-white flex gap-3">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask us anything..."
                className="rounded-xl h-12 border-border/50 bg-muted/20 focus:bg-background transition-all font-medium"
                disabled={sendMessage.isPending}
              />
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20 shrink-0"
                disabled={sendMessage.isPending || !text.trim()}
              >
                {sendMessage.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
