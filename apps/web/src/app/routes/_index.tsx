import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_COUNCIL_ADDRESS, NETWORK } from "../../../../../constants";

export default function IndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/c/${NETWORK}/${DEFAULT_COUNCIL_ADDRESS}`);
  }, [navigate]);

  return null;
}
