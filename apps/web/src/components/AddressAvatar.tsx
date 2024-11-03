import { cn } from "@repo/ui/lib/utils";
import makeBlockie from "ethereum-blockies-base64";
import { useMemo } from "react";
import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { useEnsAddress, useEnsAvatar, useEnsName } from "wagmi";
import { mainnetConfig } from "../utils/wallet";

const transparentPixel =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function AddressAvatar({
  addressOrEns,
  size,
}: { addressOrEns: string; size: number }) {
  const isEnsName = addressOrEns.endsWith(".eth");
  const isAddr = isAddress(addressOrEns);

  // If addressOrEns is an address, get the ens name
  const { data: ensName } = useEnsName({
    address: isAddr ? addressOrEns : undefined,
    chainId: 1,
    query: { enabled: !isEnsName && isAddr },
    config: mainnetConfig,
  });

  let normalizedName: string | undefined;
  try {
    normalizedName = isEnsName
      ? normalize(addressOrEns)
      : ensName?.toLowerCase();
  } catch (error) {}

  // If we did not have the address and normalizedName is an ens name, get the ens address
  const { data: ensAddress } = useEnsAddress({
    name: normalizedName,
    chainId: 1,
    query: { enabled: !!normalizedName && !isAddr },
    config: mainnetConfig,
  });

  // If normalizedName is an ens name, get the ens avatar
  const { data: ensAvatar, isLoading } = useEnsAvatar({
    name: normalizedName,
    chainId: 1,
    query: { enabled: !!normalizedName },
    config: mainnetConfig,
  });
  const address = ensAddress ?? addressOrEns;
  const src = useMemo(() => {
    if (isLoading) return transparentPixel;
    if (ensAvatar) return ensAvatar;
    if (!isLoading && isAddress(address)) return makeBlockie(address);
    return transparentPixel;
  }, [ensAvatar, address, isLoading]);

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("rounded bg-gray-600")}
    />
  );
}

export default AddressAvatar;
