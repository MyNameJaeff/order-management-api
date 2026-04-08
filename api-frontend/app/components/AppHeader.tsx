type AppHeaderProps = {
    apiBase: string;
    health: string;
    error: string;
    onRefresh: () => void;
};

export function AppHeader({ apiBase, health, error, onRefresh }: AppHeaderProps) {
    return (
        <header className="mb-6 rounded-xl border border-zinc-700 bg-zinc-900/80 p-4 shadow">
            <h1 className="text-xl font-semibold">Order Management</h1>
            <p className="mt-1 text-sm text-zinc-300">Backend: {apiBase}</p>
            <p className="text-sm text-zinc-300">Health: {health}</p>
            {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
            <button
                className="mt-3 rounded border border-zinc-600 bg-zinc-800 px-3 py-1 text-sm text-zinc-100 hover:bg-zinc-700"
                onClick={onRefresh}
            >
                Refresh
            </button>
        </header>
    );
}
