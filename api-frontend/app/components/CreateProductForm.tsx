import { FormEvent } from "react";

type CreateProductFormProps = {
    productName: string;
    productPrice: string;
    productStock: string;
    productDescription: string;
    productImageUrl: string;
    statusMessage?: string;
    setProductName: (value: string) => void;
    setProductPrice: (value: string) => void;
    setProductStock: (value: string) => void;
    setProductDescription: (value: string) => void;
    setProductImageUrl: (value: string) => void;
    onSubmit: (e: FormEvent) => void;
};

export function CreateProductForm({
    productName,
    productPrice,
    productStock,
    productDescription,
    productImageUrl,
    statusMessage,
    setProductName,
    setProductPrice,
    setProductStock,
    setProductDescription,
    setProductImageUrl,
    onSubmit,
}: CreateProductFormProps) {
    return (
        <section className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 shadow">
            <h2 className="mb-3 text-lg font-medium">Create Product</h2>
            <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" onSubmit={onSubmit}>
                <input
                    className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100 placeholder-zinc-400"
                    placeholder="Name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                />
                <input
                    className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100 placeholder-zinc-400"
                    placeholder="Price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    required
                />
                <input
                    className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100 placeholder-zinc-400"
                    placeholder="Stock"
                    type="number"
                    min={0}
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    required
                />
                <input
                    className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100 placeholder-zinc-400"
                    placeholder="Description (optional)"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                />
                <input
                    className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100 placeholder-zinc-400"
                    placeholder="Image URL (optional)"
                    value={productImageUrl}
                    onChange={(e) => setProductImageUrl(e.target.value)}
                />
                <button
                    className="rounded border border-zinc-500 bg-zinc-800 px-2 py-1 font-medium text-zinc-100 hover:bg-zinc-700"
                    type="submit"
                >
                    Add Product
                </button>
            </form>
            {statusMessage && <p className="mt-3 text-sm text-emerald-400">{statusMessage}</p>}
        </section>
    );
}
