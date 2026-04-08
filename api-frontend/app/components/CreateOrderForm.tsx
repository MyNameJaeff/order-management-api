import { FormEvent } from "react";
import { CreateOrderItem, Product } from "../lib/types";
import { ProductImage } from "./ProductImage";

type CreateOrderFormProps = {
    products: Product[];
    orderProductId: string;
    orderQuantity: string;
    draftItems: CreateOrderItem[];
    selectedProduct?: Product;
    quantityInvalid: boolean;
    maxStockForSelection: number;
    statusMessage?: string;
    setOrderProductId: (value: string) => void;
    setOrderQuantity: (value: string) => void;
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    onSubmitOrder: (e: FormEvent) => void;
};

export function CreateOrderForm({
    products,
    orderProductId,
    orderQuantity,
    draftItems,
    selectedProduct,
    quantityInvalid,
    maxStockForSelection,
    statusMessage,
    setOrderProductId,
    setOrderQuantity,
    onAddItem,
    onRemoveItem,
    onSubmitOrder,
}: CreateOrderFormProps) {
    const orderTotal = draftItems.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.product_id);
        if (!product) {
            return sum;
        }
        return sum + product.price * item.quantity;
    }, 0);

    return (
        <section className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 shadow">
            <h2 className="mb-3 text-lg font-medium">Create Order</h2>
            <div className="grid gap-2 sm:grid-cols-3">
                <select
                    className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100"
                    value={orderProductId}
                    onChange={(e) => setOrderProductId(e.target.value)}
                >
                    <option value="">Select product</option>
                    {products.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
                <input
                    className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100 placeholder-zinc-400"
                    placeholder="Quantity"
                    type="number"
                    min={1}
                    max={Math.max(1, maxStockForSelection)}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(e.target.value)}
                />
                <button
                    className="rounded border border-zinc-500 bg-zinc-800 px-2 py-1 font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
                    type="button"
                    disabled={!selectedProduct || quantityInvalid}
                    onClick={onAddItem}
                >
                    Add Item
                </button>
            </div>
            {selectedProduct && (
                <p className="mt-2 text-sm text-zinc-300">Available stock: {selectedProduct.stock}</p>
            )}
            {selectedProduct && quantityInvalid && (
                <p className="mt-1 text-sm text-red-400">Quantity exceeds available stock.</p>
            )}

            <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-200">Order Items</h3>
                {draftItems.length === 0 ? (
                    <p className="text-sm text-zinc-400">No items added yet.</p>
                ) : (
                    draftItems.map((item, index) => {
                        const product = products.find((p) => p.id === item.product_id);
                        const unitPrice = product?.price ?? 0;
                        const lineTotal = unitPrice * item.quantity;

                        return (
                            <div
                                key={`${item.product_id}-${index}`}
                                className="flex items-center gap-4 rounded border border-zinc-700 bg-zinc-800 p-2 text-sm"
                            >
                                <ProductImage src={product?.image_url} alt={product?.name || "Product Image"} className="mr-3 h-10 w-10 shrink-0 rounded object-cover" />
                                <div>
                                    <p>{product?.name ?? item.product_id}</p>
                                    <p className="text-zinc-400">Quantity: {item.quantity}</p>
                                    <p className="text-zinc-400">Unit: ${unitPrice.toFixed(2)}</p>
                                    <p className="text-zinc-200">Line Total: ${lineTotal.toFixed(2)}</p>
                                </div>
                                <button
                                    className="ml-auto rounded border border-zinc-600 bg-zinc-900 px-2 py-1 hover:bg-zinc-700"
                                    type="button"
                                    onClick={() => onRemoveItem(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="mt-4 rounded border border-zinc-700 bg-zinc-800 p-3 text-sm">
                <p className="text-zinc-300">Order Summary</p>
                <p className="mt-1 font-semibold text-zinc-100">Order Total: ${orderTotal.toFixed(2)}</p>
            </div>

            <form className="mt-4" onSubmit={onSubmitOrder}>
                <button
                    className="w-full rounded border border-zinc-500 bg-zinc-800 px-3 py-2 font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
                    type="submit"
                    disabled={draftItems.length === 0}
                >
                    Create Order
                </button>
            </form>
            {statusMessage && <p className="mt-3 text-sm text-emerald-400">{statusMessage}</p>}
        </section>
    );
}
