import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CouncilFactory", (m) => {
  const councilFactory = m.contract("CouncilFactory", [
    "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08",
  ]);

  const council = m.call(councilFactory, "createCouncil", [
    {
      councilName: "Spacing Guild",
      councilSymbol: "SPA",
      councilMembers: [["0xf632ce27ea72dea30d30c1a9700b6b3bceaa05cf", 200]],
      grantees: [
        ["ENS Wayback Machine", "0x6ea869B6870dd98552B0C7e47dA90702a436358b"],
        ["Giveth House", "0xB6989F472Bef8931e6Ca882b1f875539b7D5DA19"],
        ["EVMcrispr", "0xeafFF6dB1965886348657E79195EB6f1A84657eB"],
      ],
      distributionToken: m.getParameter("distributionToken"),
    },
  ]);

  const councilAddress = m.readEventArgument(
    council,
    "CouncilCreated",
    "council",
  );

  const councilContract = m.contractAt("Council", councilAddress);

  return { councilFactory, councilContract };
});
