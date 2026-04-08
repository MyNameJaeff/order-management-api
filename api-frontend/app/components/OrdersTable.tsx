import { Fragment, useState } from "react";
import { ProductImage } from "./ProductImage";
import { formatTimestamp } from "../lib/format";
import { Order, OrderStatus, Product } from "../lib/types";

type OrdersTableProps = {
    orders: Order[];
    loading: boolean;
    productsById: Map<string, Product>;
    onComplete: (id: string) => void;
    onCancel: (id: string) => void;
    onDelete: (id: string) => void;
};

const STATUS_STYLES: Record<OrderStatus, string> = {
    Pending: "bg-amber-900/40 text-amber-300 border border-amber-700/50",
    Completed: "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50",
    Cancelled: "bg-red-900/30 text-red-400 border border-red-700/40",
};

function ActionButton({
    label,
    onClick,
    disabled = false,
    variant = "default",
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "danger";
}) {
    const base = "rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400";
    if (disabled) {
        return (
            <button className={`${base} border border-zinc-700 bg-zinc-800/50 text-zinc-600 cursor-not-allowed`} disabled type="button">
                {label}
            </button>
        );
    }
    if (variant === "danger") {
        return (
            <button className={`${base} border border-red-800/60 bg-red-950/40 text-red-400 hover:bg-red-900/50 hover:text-red-300`} onClick={onClick} type="button">
                {label}
            </button>
        );
    }
    return (
        <button className={`${base} border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100`} onClick={onClick} type="button">
            {label}
        </button>
    );
}

export function OrdersTable({
    orders,
    loading,
    productsById,
    onComplete,
    onCancel,
    onDelete,
}: OrdersTableProps) {
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const toggleOrderDetails = (orderId: string) => {
        setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
    };

    return (
        <section className="rounded-xl border border-zinc-700/80 bg-zinc-900/80 shadow-lg shadow-black/30">
            <div className="border-b border-zinc-700/80 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Orders</h2>
            </div>

            {loading ? (
                <p className="px-4 py-6 text-sm text-zinc-400">Loading…</p>
            ) : orders.length === 0 ? (
                <p className="px-4 py-6 text-sm text-zinc-500">No orders found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-zinc-700/80">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Product</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Qty</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Status</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Total</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Created</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o, idx) => {
                                const isExpanded = expandedOrderId === o.id;
                                const itemCount = o.items.reduce((sum, item) => sum + item.quantity, 0);
                                const itemNames = o.items
                                    .map((item) => productsById.get(item.product_id)?.name ?? item.product_id)
                                    .join(", ");
                                const rowBg = idx % 2 === 0 ? "bg-zinc-900/60" : "bg-zinc-800/30";
                                const statusStyle = STATUS_STYLES[o.status] ?? "bg-zinc-800 text-zinc-400 border border-zinc-600";

                                return (
                                    <Fragment key={o.id}>
                                        <tr className={`${rowBg} border-b border-zinc-700/50 transition-colors hover:bg-zinc-700/30`}>
                                            <td className="max-w-[200px] truncate px-4 py-3 text-zinc-200" title={itemNames}>
                                                {itemNames || "—"}
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-zinc-300">{itemCount}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 tabular-nums text-zinc-200">${o.total_price.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-zinc-400">{formatTimestamp(o.created_at)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <ActionButton
                                                        label="Complete"
                                                        onClick={() => onComplete(o.id)}
                                                        disabled={o.status === "Completed"}
                                                    />
                                                    <ActionButton
                                                        label="Cancel"
                                                        onClick={() => onCancel(o.id)}
                                                        disabled={o.status === "Cancelled"}
                                                    />
                                                    <ActionButton
                                                        label="Delete"
                                                        onClick={() => onDelete(o.id)}
                                                        variant="danger"
                                                    />
                                                    <ActionButton
                                                        label={isExpanded ? "Hide" : "Details"}
                                                        onClick={() => toggleOrderDetails(o.id)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="border-b border-zinc-700/50 bg-zinc-800/40">
                                                <td colSpan={6} className="px-4 py-4">
                                                    <div className="grid gap-4 lg:grid-cols-2">
                                                        {/* Items */}
                                                        <div>
                                                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                                                Items ({o.items.length})
                                                            </h3>
                                                            <div className="space-y-2">
                                                                {o.items.map((item, i) => {
                                                                    const product = productsById.get(item.product_id);
                                                                    return (
                                                                        <div
                                                                            key={`${o.id}-${item.product_id}-${i}`}
                                                                            className="flex items-start gap-3 rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3"
                                                                        >
                                                                            <ProductImage
                                                                                src={product?.image_url}
                                                                                alt={product?.name ?? "Product"}
                                                                                className="h-14 w-14 shrink-0 rounded-md object-cover"
                                                                            />
                                                                            <div className="min-w-0 space-y-0.5 text-xs">
                                                                                <p className="font-semibold text-zinc-200 truncate">{product?.name ?? "Unknown product"}</p>
                                                                                <p className="text-zinc-400">{product?.description || "—"}</p>
                                                                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1 text-zinc-400">
                                                                                    <span>Qty: <span className="text-zinc-200">{item.quantity}</span></span>
                                                                                    <span>Unit: <span className="text-zinc-200">${item.unit_price.toFixed(2)}</span></span>
                                                                                    <span>Line: <span className="text-zinc-200">${item.line_total.toFixed(2)}</span></span>
                                                                                </div>
                                                                                <p className="text-zinc-600 pt-0.5">ID: {item.product_id}</p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Metadata */}
                                                        <div>
                                                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                                                Order Metadata
                                                            </h3>
                                                            <dl className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3 text-xs">
                                                                {[
                                                                    ["Order ID", o.id],
                                                                    ["Status", o.status],
                                                                    ["Total Price", `$${o.total_price.toFixed(2)}`],
                                                                    ["Created At", formatTimestamp(o.created_at)],
                                                                    ["Distinct Products", o.items.length],
                                                                    ["Total Quantity", itemCount],
                                                                    ["Last Product Update", formatTimestamp(
                                                                        o.items.map((item) => productsById.get(item.product_id)?.updated_at).find(Boolean) ?? null
                                                                    )],
                                                                ].map(([label, value]) => (
                                                                    <div key={String(label)} className="flex justify-between gap-4 border-b border-zinc-700/40 py-1.5 last:border-0 last:pb-0 first:pt-0">
                                                                        <dt className="text-zinc-500">{label}</dt>
                                                                        <dd className="text-right font-medium text-zinc-200 break-all">{String(value)}</dd>
                                                                    </div>
                                                                ))}
                                                            </dl>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}