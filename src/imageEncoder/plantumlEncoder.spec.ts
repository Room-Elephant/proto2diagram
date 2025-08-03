import { complexPuml, simplePuml } from "../tests/input/puml";
import { encode } from "./plantumlEncoder";

describe("Compress puml", () => {
  it("should compress diagram with a simple example", () => {
    const expected =
      "ut8eBaaiAYdDpU5opCbCJbNGjLDmoa-oKd0iBSb8pIl9J4uioSpFKmXABInDBIxX0iefw0BLW1LZKLLSa9zNdChba9gN0Z8J0000";
    const result = encode(simplePuml);

    expect(result).toBe(expected);
  });
  it("should compress diagram with a complex example", () => {
    const expected =
      "ZPGnRy8m48Lt_mgBpWoTgZ9Kn0v8bL1L5LMTZ_XAhIHsE3kbzDSt1bIS40X3XiJVU_VUMGgREW_awx9WBjUc0eAIho3BrsHhewGjBF6xsMmcKXaHNs3KbhJtQBYd6bbqvd1Jeyam8RBRWq6AM2tpdIWQiWVCl2LXII7TWY_qP_COZ1Mh0RHRA7bCPJhlKRmsoz2Phi3usnF5eiwarAerqh1kRer_WHBvSrb1veVXfVv5Vlym30urFco_4nisDLnYJwOtNElrgF_8lde25Vum1k4ZVtT8h3fLuQEv9kUvBC2v4GV7evv9crnYPetgHqKRNS0bJybOoC37Jwr9a-PAFopb8QR-1e_j72n-wsZ5X4l287aB_PtlzH0j3z7na5VdorWg-VXiVb2crY1JpNYokqxXzk2pviVOnnQgCHakaEnzmYP3ylta_irDqQZm6_e3";

    const result = encode(complexPuml);

    expect(result).toBe(expected);
  });
});
