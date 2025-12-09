import {patchJson, PatchJsonParams} from "@/utils/jsonPatch";

const duplicatedKeyStrategies: PatchJsonParams["duplicatedKey"][] = ["ignore", "first", "last", "pop"];

describe("patchJson", () => {
  describe("merges target into source across duplicated key strategies", () => {
    const source = `{
  "foo": "Foo",
  "bar": "Bar"
}`;
    const target = `{
  "foo": "Hoge"
}`;

    const expected = `{
  "foo": "Hoge",
  "bar": "Bar"
}`;
    test.each(duplicatedKeyStrategies)("keeps missing keys while duplicatedKey='%s'", strategy =>
      expect(patchJson({source, target, duplicatedKey: strategy})).toBe(expected),
    );
  });
});
