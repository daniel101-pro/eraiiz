export interface CartItem {
    _id: string;
    name: string;
    price: number;
    currency?: string;
    quantity: number;
    selectedSize: string;
    images: string[];
    sellerId?: string;
    carbonFootprint?: {
        total: string;
        impactScore: string;
        equivalentCarRide: string;
        treesToOffset: string;
        savingsVsConventional?: string;
        modelVersion?: string;
        breakdown?: {
            materials?: string;
            production?: string;
            shipping?: string;
            packaging?: string;
        };
    };
    sustainability?: any;
}

export interface CartContextType {
    cartItems: CartItem[];
    removeFromCart?: (id: string, size: string) => void;
    updateQuantity?: (id: string, size: string, quantity: number) => void;
    getCartTotal?: () => number;
    clearCart?: () => void;
}
