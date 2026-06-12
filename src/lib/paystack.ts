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
    if (!publicKey || !publicKey.startsWith("pk_")) {
      toast.error("Paystack is not configured. Please add your Public Key to the .env file.");
      return;
    }

    const handler = (window as any).PaystackPop.setup({
      key: publicKey,
      email: email,
      amount: Math.round(amount * 100), // Paystack takes amount in pesewas
      currency: "GHS",
      ref: 'CC-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      metadata: {
        ...metadata,
        custom_fields: [
          {
            display_name: "Platform",
            variable_name: "platform",
            value: "ClipCapital App"
          },
          ...(metadata?.custom_fields || [])
        ]
      },
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
