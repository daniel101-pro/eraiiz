export {};

declare global {
  interface Window {
    PaystackPop?: new () => {
      newTransaction: (options: {
        key: string;
        email: string;
        amount: number;
        reference: string;
        onSuccess?: (transaction: { reference?: string }) => void;
        onCancel?: () => void;
      }) => void;
      resumeTransaction?: (
        accessCode: string,
        callbacks?: {
          onSuccess?: (transaction: { reference?: string }) => void;
          onCancel?: () => void;
        }
      ) => void;
    };
  }
}
