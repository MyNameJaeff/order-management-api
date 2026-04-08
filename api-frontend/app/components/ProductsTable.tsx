import { useState } from "react";
import { ProductImage } from "./ProductImage";
import { formatTimestamp } from "../lib/format";
import { validateOptionalImageUrl, validateProductInputs } from "../lib/validation";
import { Product } from "../lib/types";

type ProductsTableProps = {
    products: Product[];
    loading: boolean;
    onDelete: (id: string) => void;
    onUpdate: (id: string, patch: {
        name: string;
        price: number;
        stock: number;
        description: string | null;
        image_url: string | null;
    }) => Promise<boolean>;
};

export function ProductsTable({ products, loading, onDelete, onUpdate }: ProductsTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState<string>("");
    const [editPrice, setEditPrice] = useState<string>("");
    const [editStock, setEditStock] = useState<string>("");
    const [editDescription, setEditDescription] = useState<string>("");
    const [editImageUrl, setEditImageUrl] = useState<string>("");
    const [editError, setEditError] = useState<string>("");

    const beginEdit = (product: Product) => {
        setEditingId(product.id);
        setEditName(product.name);
        setEditPrice(product.price.toString());
        setEditStock(product.stock.toString());
        setEditDescription(product.description ?? "");
        setEditImageUrl(product.image_url ?? "");
        setEditError("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditError("");
    };

    const saveEdit = async () => {
        if (!editingId) return;

        const validation = validateProductInputs(editPrice, editStock);
        if (!validation.valid) {
            setEditError(validation.message ?? "Invalid product input");
            return;
        }

        const imageValidation = validateOptionalImageUrl(editImageUrl);
        if (!imageValidation.valid) {
            setEditError(imageValidation.message ?? "Invalid image URL");
            return;
        }

        const ok = await onUpdate(editingId, {
            name: editName.trim(),
            price: validation.price as number,
            stock: validation.stock as number,
            description: editDescription.trim().length ? editDescription.trim() : null,
            image_url: imageValidation.normalized ?? null,
        });

        if (ok) {
            cancelEdit();
        }
    };

    return (
        <section className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 shadow">
            <h2 className="mb-3 text-lg font-medium">Products</h2>
            {editError && <p className="mb-3 text-sm text-red-400">{editError}</p>}
            {loading ? (
                <p className="text-zinc-300">Loading...</p>
            ) : products.length === 0 ? (
                <p className="text-zinc-400">No products yet.</p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((p) => {
                        const isEditing = editingId === p.id;

                        return (
                            <article
                                key={p.id}
                                className="rounded-lg border border-zinc-700 bg-zinc-900 p-4"
                            >
                                <div className="mb-3 flex items-start gap-3">
                                    <ProductImage
                                        src={isEditing ? editImageUrl : p.image_url}
                                        alt={isEditing ? editName || p.name : p.name}
                                        className="h-16 w-16 rounded object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                        {isEditing ? (
                                            <input
                                                className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                            />
                                        ) : (
                                            <h3 className="truncate text-base font-semibold">{p.name}</h3>
                                        )}
                                        <p className="mt-1 text-xs text-zinc-400">ID: {p.id}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div>
                                        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Description</p>
                                        {isEditing ? (
                                            <input
                                                className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100 placeholder-zinc-400"
                                                placeholder="Description"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                            />
                                        ) : (
                                            <p>{p.description || "-"}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Price</p>
                                            {isEditing ? (
                                                <input
                                                    className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100"
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={editPrice}
                                                    onChange={(e) => setEditPrice(e.target.value)}
                                                />
                                            ) : (
                                                <p>${p.price.toFixed(2)}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Stock</p>
                                            {isEditing ? (
                                                <input
                                                    className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100"
                                                    type="number"
                                                    min={0}
                                                    value={editStock}
                                                    onChange={(e) => setEditStock(e.target.value)}
                                                />
                                            ) : (
                                                <p>{p.stock}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-1 text-xs uppercase tracking-wide text-zinc-400">Image URL</p>
                                        {isEditing ? (
                                            <input
                                                className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-100 placeholder-zinc-400"
                                                placeholder="https://..."
                                                value={editImageUrl}
                                                onChange={(e) => setEditImageUrl(e.target.value)}
                                            />
                                        ) : (
                                            <p className="truncate text-zinc-300">{p.image_url || "-"}</p>
                                        )}
                                    </div>

                                    <p className="text-xs text-zinc-400">Updated: {formatTimestamp(p.updated_at)}</p>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {isEditing ? (
                                        <>
                                            <button
                                                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 hover:bg-zinc-700"
                                                onClick={() => void saveEdit()}
                                                type="button"
                                            >
                                                Save
                                            </button>
                                            <button
                                                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 hover:bg-zinc-700"
                                                onClick={cancelEdit}
                                                type="button"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 hover:bg-zinc-700"
                                                onClick={() => beginEdit(p)}
                                                type="button"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 hover:bg-zinc-700"
                                                onClick={() => onDelete(p.id)}
                                                type="button"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
