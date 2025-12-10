import {patchJson, PatchJsonParams} from "@/utils/jsonPatch";

const duplicatedKeyStrategies: PatchJsonParams["duplicatedKey"][] = ["ignore", "first", "last", "pop"];

describe("patchJson", () => {
  describe("merges target into source and keeps missing keys", () => {
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
    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
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
    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
      expect(patchJson({oldSource, source, target, duplicatedKey: strategy})).toBe(expected),
    );
  });

  describe("handles complex json with duplicate comments", () => {
    const oldSource = `{
  "_comment": "Items",
  "item.examplemod.example_item": "Example Item",

  "_comment": "Blocks",
  "block.examplemod.example_block": "Example Block",
  "block.examplemod.example_block.tooltip": "WIP",
  "container.examplemod.custom_gui": "Custom GUI",

  "_comment": "Entities",
  "entity.examplemod.custom_mob": "Custom Mob [WIP]"
}`;

    const source = `{
  "_comment": "Items",
  "item.examplemod.example_item": "Example Item",

  "_comment": "Blocks",
  "block.examplemod.example_block": "Example Block",
  "block.examplemod.example_block.tooltip": "Right-click to open",
  "container.examplemod.custom_gui": "Custom GUI",

  "_comment": "Entities",
  "entity.examplemod.custom_mob": "Custom Mob"
}`;

    const target = `{
  "_comment": "アイテム",
  "item.examplemod.example_item": "テストアイテム",

  "_comment": "ブロック",
  "block.examplemod.example_block": "テストブロック",

  "_comment": "エンティティ",
  "entity.examplemod.custom_mob": "カスタムモブ [未完成]"
}`;

    const expected = {
      ignore: `{
  "_comment": "Items",
  "item.examplemod.example_item": "テストアイテム",

  "_comment": "Blocks",
  "block.examplemod.example_block": "テストブロック",
  "block.examplemod.example_block.tooltip": "Right-click to open",
  "container.examplemod.custom_gui": "Custom GUI",

  "_comment": "Entities",
  "entity.examplemod.custom_mob": "Custom Mob"
}`,
      first: `{
  "_comment": "アイテム",
  "item.examplemod.example_item": "テストアイテム",

  "_comment": "アイテム",
  "block.examplemod.example_block": "テストブロック",
  "block.examplemod.example_block.tooltip": "Right-click to open",
  "container.examplemod.custom_gui": "Custom GUI",

  "_comment": "アイテム",
  "entity.examplemod.custom_mob": "Custom Mob"
}`,
      last: `{
  "_comment": "エンティティ",
  "item.examplemod.example_item": "テストアイテム",

  "_comment": "エンティティ",
  "block.examplemod.example_block": "テストブロック",
  "block.examplemod.example_block.tooltip": "Right-click to open",
  "container.examplemod.custom_gui": "Custom GUI",

  "_comment": "エンティティ",
  "entity.examplemod.custom_mob": "Custom Mob"
}`,
      pop: `{
  "_comment": "アイテム",
  "item.examplemod.example_item": "テストアイテム",

  "_comment": "ブロック",
  "block.examplemod.example_block": "テストブロック",
  "block.examplemod.example_block.tooltip": "Right-click to open",
  "container.examplemod.custom_gui": "Custom GUI",

  "_comment": "エンティティ",
  "entity.examplemod.custom_mob": "Custom Mob"
}`,
    };
    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
      expect(patchJson({oldSource, source, target, duplicatedKey: strategy})).toBe(expected[strategy]),
    );
  });

  describe("skips non-string values in target", () => {
    const source = `{
  "foo": "Foo",
  "bar": "Bar"
}`;
    const target = `{
  "foo": 123,
  "bar": {"baz": "Baz"}
}`;
    const expected = `{
  "foo": "Foo",
  "bar": "Bar"
}`;

    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
      expect(patchJson({source, target, duplicatedKey: strategy})).toBe(expected),
    );
  });

  describe("handles duplicate keys in source with single target value", () => {
    const source = `{
  "duplicatedKey": "Foo",
  "duplicatedKey": "Bar",
  "duplicatedKey": "Baz"
}`;

    const target = `{
  "duplicatedKey": "pop"
}`;

    const expected = {
      ignore: `{
  "duplicatedKey": "Foo",
  "duplicatedKey": "Bar",
  "duplicatedKey": "Baz"
}`,
      first: `{
  "duplicatedKey": "pop",
  "duplicatedKey": "pop",
  "duplicatedKey": "pop"
}`,
      last: `{
  "duplicatedKey": "pop",
  "duplicatedKey": "pop",
  "duplicatedKey": "pop"
}`,
      pop: `{
  "duplicatedKey": "pop",
  "duplicatedKey": "Bar",
  "duplicatedKey": "Baz"
}`,
    } as const;

    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
      expect(patchJson({source, target, duplicatedKey: strategy})).toBe(expected[strategy]),
    );
  });

  describe("handles multiple duplicate keys and target values", () => {
    const source = `{
  "duplicatedKey": "Foo",
  "duplicatedKey": "Bar",
  "duplicatedKey": "Baz",
  "duplicatedKey": "Qux"
}`;

    const target = `{
  "duplicatedKey": "First",
  "duplicatedKey": "Second"
}`;

    const expected = {
      ignore: `{
  "duplicatedKey": "Foo",
  "duplicatedKey": "Bar",
  "duplicatedKey": "Baz",
  "duplicatedKey": "Qux"
}`,
      first: `{
  "duplicatedKey": "First",
  "duplicatedKey": "First",
  "duplicatedKey": "First",
  "duplicatedKey": "First"
}`,
      last: `{
  "duplicatedKey": "Second",
  "duplicatedKey": "Second",
  "duplicatedKey": "Second",
  "duplicatedKey": "Second"
}`,
      pop: `{
  "duplicatedKey": "First",
  "duplicatedKey": "Second",
  "duplicatedKey": "Baz",
  "duplicatedKey": "Qux"
}`,
    } as const;

    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
      expect(patchJson({source, target, duplicatedKey: strategy})).toBe(expected[strategy]),
    );
  });
});
