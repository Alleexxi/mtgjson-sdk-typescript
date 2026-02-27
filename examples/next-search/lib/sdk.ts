import { MtgjsonSDK } from "mtgjson-sdk";

const globalForSdk = globalThis as unknown as {
  __mtgjsonSdk: MtgjsonSDK | undefined;
  __mtgjsonSdkPromise: Promise<MtgjsonSDK> | undefined;
};

export async function getSDK(): Promise<MtgjsonSDK> {
  if (globalForSdk.__mtgjsonSdk) return globalForSdk.__mtgjsonSdk;
  if (globalForSdk.__mtgjsonSdkPromise) return globalForSdk.__mtgjsonSdkPromise;

  globalForSdk.__mtgjsonSdkPromise = MtgjsonSDK.create().then((instance) => {
    globalForSdk.__mtgjsonSdk = instance;
    return instance;
  });

  return globalForSdk.__mtgjsonSdkPromise;
}
