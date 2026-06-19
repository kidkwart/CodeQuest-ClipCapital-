import { Platform, Linking } from "react-native";

interface PaystackOptions {
  email: string;
  amount: number;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
  metadata?: any;
}

export const usePaystack = () => {
  const publicKey = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder";

  const initializePayment = ({ email, amount, metadata }: PaystackOptions) => {
    if (Platform.OS === 'web') {
      // Web Implementation
      const handler = (window as any).PaystackPop.setup({
        key: publicKey,
        email,
        amount: Math.round(amount * 100),
        currency: "GHS",
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: "Platform",
              variable_name: "platform",
              value: "ClipCapital Native Web"
            },
            ...(metadata?.custom_fields || [])
          ]
        },
        callback: (response: any) => onSuccess(response.reference),
        onClose,
      });
      handler.openIframe();
    } else {
      // Native Implementation: Redirect to a secure Paystack payment link
      // In a production app, you would generate this URL from your backend
      const checkoutUrl = `https://checkout.paystack.com/check?key=${publicKey}&email=${email}&amount=${amount * 100}`;
      Linking.openURL(checkoutUrl);
      alert("Opening secure payment browser...");
    }
  };

  return { initializePayment };
};
