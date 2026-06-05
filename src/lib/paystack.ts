import { toast } from "sonner";

interface PaystackOptions {
  email: string;
  amount: number; // in GHS
  onSuccess: (reference: string) => void;
  onClose?: () => void;
  metadata?: any;
}

export const usePaystack = () => {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const initializePayment = ({ email, amount, onSuccess, onClose, metadata }: PaystackOptions) => {
    if (!publicKey || publicKey.includes("PASTE_YOUR_PUBLIC_KEY")) {
      toast.error("Paystack is not configured yet. Please provide the Public Key.");
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      key: publicKey,
      email: email,
      amount: Math.round(amount * 100), // Paystack takes amount in pesewas
      currency: "GHS",
      ref: 'CC-' + Math.floor((Math.random() * 1000000000) + 1),
      metadata: metadata,
      callback: (response: any) => {
        onSuccess(response.reference);
      },
      onClose: () => {
        if (onClose) onClose();
      }
    });

    handler.openIframe();
  };

  return { initializePayment };
};
