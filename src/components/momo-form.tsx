import { useState, useEffect, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/app-queries";
import { Smartphone, Hash } from "lucide-react";

export type MomoValue = {
  momo_provider: string;
  momo_reference: string;
  momo_number: string;
};

export function MomoFields({
  value, onChange,
}: { value: MomoValue; onChange: (v: MomoValue) => void }) {
  const { data: profile } = useProfile();

  // Auto-fill phone number if available and field is empty
  useEffect(() => {
    if (profile?.phone_number && !value.momo_number) {
      onChange({ ...value, momo_number: profile.phone_number });
    }
  }, [profile, value.momo_number]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Provider</Label>
          <select
            value={value.momo_provider}
            onChange={(e) => onChange({ ...value, momo_provider: e.target.value })}
            className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm font-bold focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="mtn">MTN MoMo</option>
            <option value="vodafone">Telecel Cash</option>
            <option value="airteltigo">AirtelTigo Money</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">MoMo Number</Label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10 h-11 rounded-xl bg-background font-bold"
              value={value.momo_number}
              onChange={(e) => onChange({ ...value, momo_number: e.target.value })}
              placeholder="024XXXXXXX"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Transaction ID / Reference</Label>
        <div className="relative">
          <Hash className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10 h-11 rounded-xl bg-background font-mono font-bold"
            value={value.momo_reference}
            onChange={(e) => onChange({ ...value, momo_reference: e.target.value })}
            placeholder="Check your MoMo SMS"
            required
          />
        </div>
      </div>
    </div>
  );
}

export function useMomo(initial?: Partial<MomoValue>) {
  const [v, set] = useState<MomoValue>({
    momo_provider: initial?.momo_provider ?? "mtn",
    momo_reference: initial?.momo_reference ?? "",
    momo_number: initial?.momo_number ?? "",
  });
  return [v, set] as const;
}

export function MomoButton({ disabled, loading, children }: { disabled?: boolean; loading?: boolean; children: ReactNode }) {
  return (
    <Button type="submit" disabled={disabled || loading} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
      {loading ? "Processing..." : children}
    </Button>
  );
}
