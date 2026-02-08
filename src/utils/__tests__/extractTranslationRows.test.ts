import { extractTranslationRows, ExtractTranslationRowsParams } from "@/utils/extractTranslationRows";

const duplicatedKeyStrategies: ExtractTranslationRowsParams["duplicatedKey"][] = ["ignore", "first", "last", "pop"];

describe("extractTranslationRows", () => {
  describe("lang format", () => {
    describe("detects added keys", () => {
      const source = `foo=Foo
bar=Bar
baz=Baz`;
      const oldSource = `foo=Foo
bar=Bar`;

      test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy => {
        const rows = extractTranslationRows({
          oldSource,
          source,
          duplicatedKey: strategy,
          format: "lang",
        });

        expect(rows).toHaveLength(3);
        expect(rows[0]).toMatchObject({ key: "foo", status: "unchanged" });
        expect(rows[1]).toMatchObject({ key: "bar", status: "unchanged" });
        expect(rows[2]).toMatchObject({ key: "baz", status: "added", newSourceValue: "Baz" });
      });
    });

    describe("detects changed keys", () => {
      const oldSource = `foo=Foo
bar=Bar`;
      const source = `foo=Foo
bar=Bar Changed`;

      test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy => {
        const rows = extractTranslationRows({
          oldSource,
          source,
          duplicatedKey: strategy,
          format: "lang",
        });

        expect(rows).toHaveLength(2);
        expect(rows[0]).toMatchObject({ key: "foo", status: "unchanged" });
        expect(rows[1]).toMatchObject({
          key: "bar",
          status: "changed",
          oldSourceValue: "Bar",
          newSourceValue: "Bar Changed",
        });
      });
    });

    describe("includes target values", () => {
      const oldSource = `foo=Foo
bar=Bar`;
      const source = `foo=Foo
bar=Bar Changed
baz=Baz`;
      const target = `foo=フー
bar=バー`;

      test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy => {
        const rows = extractTranslationRows({
          oldSource,
          source,
          target,
          duplicatedKey: strategy,
          format: "lang",
        });

        expect(rows).toHaveLength(3);
        expect(rows[0]).toMatchObject({ key: "foo", targetValue: "フー" });
        expect(rows[1]).toMatchObject({ key: "bar", targetValue: "バー" });
        expect(rows[2]).toMatchObject({ key: "baz", targetValue: undefined });
      });
    });

    describe("handles no oldSource (all keys are added)", () => {
      const source = `foo=Foo
bar=Bar`;

      test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy => {
        const rows = extractTranslationRows({
          source,
          duplicatedKey: strategy,
          format: "lang",
        });

        expect(rows).toHaveLength(2);
        expect(rows[0]).toMatchObject({ key: "foo", status: "added" });
        expect(rows[1]).toMatchObject({ key: "bar", status: "added" });
      });
    });

    describe("handles duplicated keys with pop strategy", () => {
      const oldSource = `duplicatedKey=First
duplicatedKey=Second`;
      const source = `duplicatedKey=First Changed
duplicatedKey=Second`;
      const target = `duplicatedKey=最初
duplicatedKey=次`;

      const rows = extractTranslationRows({
        oldSource,
        source,
        target,
        duplicatedKey: "pop",
        format: "lang",
      });

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        key: "duplicatedKey",
        oldSourceValue: "First",
        newSourceValue: "First Changed",
        targetValue: "最初",
        status: "changed",
      });
      expect(rows[1]).toMatchObject({
        key: "duplicatedKey",
        oldSourceValue: "Second",
        newSourceValue: "Second",
        targetValue: "次",
        status: "unchanged",
      });
    });
  });

  describe("json format", () => {
    describe("detects added keys", () => {
      const source = `{
  "foo": "Foo",
  "bar": "Bar",
  "baz": "Baz"
}`;
      const oldSource = `{
  "foo": "Foo",
  "bar": "Bar"
}`;

      test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy => {
        const rows = extractTranslationRows({
          oldSource,
          source,
          duplicatedKey: strategy,
          format: "json",
        });

        expect(rows).toHaveLength(3);
        expect(rows[0]).toMatchObject({ key: "foo", status: "unchanged" });
        expect(rows[1]).toMatchObject({ key: "bar", status: "unchanged" });
        expect(rows[2]).toMatchObject({ key: "baz", status: "added", newSourceValue: "Baz" });
      });
    });

    describe("detects changed keys", () => {
      const oldSource = `{
  "foo": "Foo",
  "bar": "Bar"
}`;
      const source = `{
  "foo": "Foo",
  "bar": "Bar Changed"
}`;

      test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy => {
        const rows = extractTranslationRows({
          oldSource,
          source,
          duplicatedKey: strategy,
          format: "json",
        });

        expect(rows).toHaveLength(2);
        expect(rows[0]).toMatchObject({ key: "foo", status: "unchanged" });
        expect(rows[1]).toMatchObject({
          key: "bar",
          status: "changed",
          oldSourceValue: "Bar",
          newSourceValue: "Bar Changed",
        });
      });
    });

    describe("includes target values", () => {
      const oldSource = `{
  "foo": "Foo",
  "bar": "Bar"
}`;
      const source = `{
  "foo": "Foo",
  "bar": "Bar Changed",
  "baz": "Baz"
}`;
      const target = `{
  "foo": "フー",
  "bar": "バー"
}`;

      test.each(duplicatedKeyStrategies)("(duplicatedKey=%s)", strategy => {
        const rows = extractTranslationRows({
          oldSource,
          source,
          target,
          duplicatedKey: strategy,
          format: "json",
        });

        expect(rows).toHaveLength(3);
        expect(rows[0]).toMatchObject({ key: "foo", targetValue: "フー" });
        expect(rows[1]).toMatchObject({ key: "bar", targetValue: "バー" });
        expect(rows[2]).toMatchObject({ key: "baz", targetValue: undefined });
      });
    });
  });
});
