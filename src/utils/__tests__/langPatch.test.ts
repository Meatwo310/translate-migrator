import {patchLang, PatchLangParams} from "@/utils/langPatch";

const duplicatedKeyStrategies: PatchLangParams["duplicatedKey"][] = ["ignore", "first", "last", "pop"];

describe("patchLang", () => {
  describe("merges target into source and keeps missing keys", () => {
    const source = `foo=Foo
bar=Bar`;
    const target = "foo=Hoge";

    const expected = `foo=Hoge
bar=Bar`;
    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
      expect(patchLang({source, target, duplicatedKey: strategy})).toBe(expected),
    );
  });

  describe("skips keys modified since oldSource", () => {
    const oldSource = `foo=Foo
bar=Bar
bazz=Baz`;
    const source = `foo=Foo
bar=Bar
bazz=Bazz`;
    const target = `foo=Hoge
bazz=Hogera`;
    const expected = `foo=Hoge
bar=Bar
bazz=Bazz`;
    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
      expect(patchLang({oldSource, source, target, duplicatedKey: strategy})).toBe(expected),
    );
  });

  describe("handles complex lang with duplicate markers and comments", () => {
    const oldSource = `# Items
_comment=Items
item.examplemod.example_item=Example Item

# Blocks
_comment=Blocks
block.examplemod.example_block=Example Block
block.examplemod.example_block.tooltip=WIP
container.examplemod.custom_gui=Custom GUI

# Entities
_comment=Entities
entity.examplemod.custom_mob=Custom Mob [WIP]`;

    const source = `# Items
_comment=Items
item.examplemod.example_item=Example Item

# Blocks
_comment=Blocks
block.examplemod.example_block=Example Block
block.examplemod.example_block.tooltip=Right-click to open
container.examplemod.custom_gui=Custom GUI

# Entities
_comment=Entities
entity.examplemod.custom_mob=Custom Mob`;

    const target = `# アイテム
_comment=アイテム
item.examplemod.example_item=テストアイテム

# ブロック
_comment=ブロック
block.examplemod.example_block=テストブロック

# エンティティ
_comment=エンティティ
entity.examplemod.custom_mob=カスタムモブ [未完成]`;

    const expected = {
      ignore: `# Items
_comment=Items
item.examplemod.example_item=テストアイテム

# Blocks
_comment=Blocks
block.examplemod.example_block=テストブロック
block.examplemod.example_block.tooltip=Right-click to open
container.examplemod.custom_gui=Custom GUI

# Entities
_comment=Entities
entity.examplemod.custom_mob=Custom Mob`,
      first: `# アイテム
_comment=アイテム
item.examplemod.example_item=テストアイテム

# アイテム
_comment=アイテム
block.examplemod.example_block=テストブロック
block.examplemod.example_block.tooltip=Right-click to open
container.examplemod.custom_gui=Custom GUI

# アイテム
_comment=アイテム
entity.examplemod.custom_mob=Custom Mob`,
      last: `# エンティティ
_comment=エンティティ
item.examplemod.example_item=テストアイテム

# エンティティ
_comment=エンティティ
block.examplemod.example_block=テストブロック
block.examplemod.example_block.tooltip=Right-click to open
container.examplemod.custom_gui=Custom GUI

# エンティティ
_comment=エンティティ
entity.examplemod.custom_mob=Custom Mob`,
      pop: `# アイテム
_comment=アイテム
item.examplemod.example_item=テストアイテム

# ブロック
_comment=ブロック
block.examplemod.example_block=テストブロック
block.examplemod.example_block.tooltip=Right-click to open
container.examplemod.custom_gui=Custom GUI

# エンティティ
_comment=エンティティ
entity.examplemod.custom_mob=Custom Mob`,
    } as const;

    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
      expect(patchLang({oldSource, source, target, duplicatedKey: strategy})).toBe(expected[strategy]),
    );
  });

  describe("handles duplicate keys in source with single target value", () => {
    const source = `duplicatedKey=Foo
duplicatedKey=Bar
duplicatedKey=Baz`;

    const target = "duplicatedKey=pop";

    const expected = {
      ignore: `duplicatedKey=pop
duplicatedKey=pop
duplicatedKey=pop`,
      first: `duplicatedKey=pop
duplicatedKey=pop
duplicatedKey=pop`,
      last: `duplicatedKey=pop
duplicatedKey=pop
duplicatedKey=pop`,
      pop: `duplicatedKey=pop
duplicatedKey=Bar
duplicatedKey=Baz`,
    } as const;

    test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy =>
      expect(patchLang({source, target, duplicatedKey: strategy})).toBe(expected[strategy]),
    );
  });
});
