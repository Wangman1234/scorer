import {Cyrano} from "../src/scripts/Cyrano";

describe("Cyrano Input", () => {
    expect(new Cyrano("|EFP1|HELLO|1|0|%|")).toBe(new Cyrano("EFP1", "HELLO", 1, 0))
})