import { getSDK } from "@/lib/sdk";

export default async function Footer() {
  const sdk = await getSDK();
  const meta = await sdk.meta;
  const data = (meta as Record<string, unknown>).data as
    | Record<string, string>
    | undefined;
  const version = data?.version ?? "unknown";
  const date = data?.date ?? "";

  return (
    <footer className="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-600">
      Powered by{" "}
      <a
        href="https://mtgjson.com"
        className="text-gray-500 hover:text-gray-300"
        target="_blank"
        rel="noopener noreferrer"
      >
        MTGJSON
      </a>{" "}
      v{version}
      {date ? ` (${date})` : ""} &middot; Built with{" "}
      <a
        href="https://www.npmjs.com/package/mtgjson-sdk"
        className="text-gray-500 hover:text-gray-300"
        target="_blank"
        rel="noopener noreferrer"
      >
        mtgjson-sdk
      </a>
    </footer>
  );
}
