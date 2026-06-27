"use client";

function describeError(err: unknown): string {
  if (err instanceof globalThis.Error) {
    return err.message || "Something went wrong. Please refresh the page.";
  }
  if (typeof err === "string" && err) return err;
  return "Something went wrong. Please refresh the page.";
}

export default function GlobalError({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-dim)] p-8">
        <h2 className="text-lg font-semibold text-[var(--color-danger)]">Something went wrong</h2>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">{describeError(error)}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[#080a0d]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
