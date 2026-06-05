import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type MomoValue = { momo_provider: string; momo_reference: string };

export function MomoFields({
  value, onChange,
}: { value: MomoValue; onChange: (v: MomoValue) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs">Provider</Label>
        <select
          value={value.momo_provider}
          onChange={(e) => onChange({ ...value, momo_provider: e.target.value })}
          className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="mtn">MTN MoMo</option>
          <option value="vodafone">Vodafone Cash</option>
          <option value="airteltigo">AirtelTigo Money</option>
        </select>
      </div>
      <div>
        <Label className="text-xs">Transaction reference</Label>
        <Input
          className="mt-1"
          value={value.momo_reference}
          onChange={(e) => onChange({ ...value, momo_reference: e.target.value })}
          placeholder="e.g. 1234567890"
          required
        />
      </div>
    </div>
  );
}

export function useMomo(initial?: Partial<MomoValue>) {
  const [v, set] = useState<MomoValue>({
    momo_provider: initial?.momo_provider ?? "mtn",
    momo_reference: initial?.momo_reference ?? "",
  });
  return [v, set] as const;
}

export function MomoButton({ disabled, loading, children }: { disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" disabled={disabled || loading} className="w-full">
      {loading ? "Submitting…" : children}
    </Button>
  );
}
