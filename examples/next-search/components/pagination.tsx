"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Pagination({
  currentPage,
  hasMore,
}: {
  currentPage: number;
  hasMore: boolean;
}) {
  const searchParams = useSearchParams();

  function makePageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/?${params.toString()}`;
  }

  if (currentPage === 1 && !hasMore) return null;

  return (
    <div className="flex items-center justify-center gap-4 pt-4">
      {currentPage > 1 ? (
        <Link
          href={makePageUrl(currentPage - 1)}
          className="rounded bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded bg-gray-800/50 px-4 py-2 text-sm text-gray-600">
          Previous
        </span>
      )}

      <span className="text-sm text-gray-400">Page {currentPage}</span>

      {hasMore ? (
        <Link
          href={makePageUrl(currentPage + 1)}
          className="rounded bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
        >
          Next
        </Link>
      ) : (
        <span className="rounded bg-gray-800/50 px-4 py-2 text-sm text-gray-600">
          Next
        </span>
      )}
    </div>
  );
}
