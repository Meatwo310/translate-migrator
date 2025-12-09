import {patchJson, PatchJsonParams} from "@/utils/jsonPatch";

const duplicatedKeyStrategies: PatchJsonParams["duplicatedKey"][] = ["ignore", "first", "last", "pop"];

describe("patchJson", () => {
  describe("merges target into source", () => {
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
    test.each(duplicatedKeyStrategies)("keeps missing keys (duplicatedKey=%s)", strategy =>
      expect(patchJson({source, target, duplicatedKey: strategy})).toBe(expected),
    );
  });

  describe("skips keys modified since oldSource", () => {
    const oldSource = `{
  "foo": "Foo",
  "bar": "Bar",
  "bazz": "Baz"
}`;
    const source = `{
  "foo": "Foo",
  "bar": "Bar",
  "bazz": "Bazz"
}`;
    const target = `{
  "foo": "Hoge",
  "bazz": "Hogera"
}`;
    const expected = `{
  "foo": "Hoge",
  "bar": "Bar",
  "bazz": "Bazz"
}`;
    test.each(duplicatedKeyStrategies)("skips modified keys (duplicatedKey=%s)", strategy =>
      expect(patchJson({oldSource, source, target, duplicatedKey: strategy})).toBe(expected),
    );
  });
});
