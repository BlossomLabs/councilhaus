import { redirect } from "@remix-run/react";
import { DEFAULT_COUNCIL_ADDRESS, NETWORK } from "../../../../../constants";

export async function clientLoader() {
  return redirect(`/c/${NETWORK}/${DEFAULT_COUNCIL_ADDRESS}`);
}

export default function IndexPage() {
  return null;
}
