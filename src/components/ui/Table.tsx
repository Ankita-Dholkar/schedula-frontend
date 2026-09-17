import { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  /** Optional custom cell renderer. Receives the row and returns a ReactNode. */
  render?: (row: T, index: number) => ReactNode;
  /** Optional className for the <td> */
  className?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  /** Unique key extractor for each row */
  rowKey: (row: T, index: number) => string;
  /** Optional element shown when data is empty */
  emptyState?: ReactNode;
  /** Optional className for the wrapper div */
  className?: string;
};

export default function Table<T>({
  columns,
  data,
  rowKey,
  emptyState,
  className = "",
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--canvas)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-sm text-[var(--muted)]">
                  {emptyState ?? "No data available."}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--canvas)] transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-[var(--ink)] ${col.className ?? ""}`}>
                      {col.render ? col.render(row, i) : (row as Record<string, unknown>)[col.key] as ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
