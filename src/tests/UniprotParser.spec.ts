import {beforeEach, describe} from "node:test";
import {Parser, Accession} from "../classes/UniprotParser";
import * as assert from "assert";


describe("UniprotParser", () => {
  describe("Parser", async () => {
    it("retrieve extra data from uniprot through their REST API", async () => {
      const parser = new Parser();
      const ids = ["Q71U36", "P62805", "P68032"]
      for await (const result of parser.parse(ids)) {
        console.log(result)
      }
      await Promise.resolve()
      assert.ok(true)
    })
  })
});