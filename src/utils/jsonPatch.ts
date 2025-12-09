import {JsonProperty, parse as parseJson, Visitor} from "@anchan828/json-ast";

type PropertyMap = Map<string, string[]>;
type SafeGetStrategy = (property: PropertyMap, key: string, fallbackValue: string) => string;

export class JsonKVVisitor extends Visitor {
  propertyMap: PropertyMap = new Map();

  private safePush = (key: string, value: string) => {
    const property = this.propertyMap.get(key);
    if (property == null) {
      this.propertyMap.set(key, [value]);
    } else {
      property.push(value);
    }
  };

  property(propertyNode: JsonProperty) {
    const key = propertyNode.key.value;
    const value = propertyNode.value.value;
    if (typeof value !== "string") return;
    this.safePush(key, value);
  }
}

const parseToPropertyMap = (content?: string | null): PropertyMap => {
  if (content == null) return new Map();
  const visitor = new JsonKVVisitor();
  visitor.visit(parseJson(content));
  return visitor.propertyMap;
};

export type PatchJsonParams = {
  /**
   * 古い翻訳元JSONオブジェクト。
   *
   * `oldSource`に存在するキーが`source`と異なる場合、`target`のパッチをスキップする。
   *
   * キーが`oldSource`に存在しない場合や、`oldSource`自体が指定されなかった場合については、通常通り`source`へ`target`をパッチする。
   */
  oldSource?: string;

  /** 翻訳元JSONオブジェクト。 */
  source: string;

  /** 翻訳先JSONオブジェクト。 */
  target: string;

  /**
   * 重複するキーの処理方法。
   * - `ignore`: `target`の値を無視し、`source`の値をそのまま使用する。
   * - `first`: `target`に出現する最初の値を使用する。
   * - `last`: `target`に出現する最後の値を使用する。
   * - `pop`: `target`に出現する値を順番に使用する。
   */
  duplicatedKey: "ignore" | "first" | "last" | "pop";
};

const STRATEGIES: Record<PatchJsonParams["duplicatedKey"], SafeGetStrategy> = {
  // targetを見ずにsourceの値をそのまま返す
  ignore: (map, key, fallbackValue) => {
    const property = map.get(key);
    if (property == null || property.length !== 1) return fallbackValue;
    return property[0];
  },

  // 配列の最初の要素を採用
  first: (map, key, fallbackValue) => {
    return map.get(key)?.[0] ?? fallbackValue;
  },

  // 配列の最後の要素を採用
  last: (map, key, fallbackValue) => {
    const values = map.get(key);
    return values?.at(-1) ?? fallbackValue;
  },

  // 配列の先頭から順に取り出し（破壊的変更）、なくなったら元の値を使う
  pop: (map, key, fallbackValue) => {
    const values = map.get(key);
    return values?.shift() ?? fallbackValue;
  },
};

export const patchJson = (
  {oldSource, source, target, duplicatedKey}: PatchJsonParams,
) => {
  const oldSourceMap = parseToPropertyMap(oldSource);
  const sourceMap = parseToPropertyMap(source);
  const changedKeys = oldSourceMap.keys()
    .filter(key => {
      const oldVal = oldSourceMap.get(key);
      const val = sourceMap.get(key);
      return oldVal?.length === 1
        && oldVal.length === val?.length
        && oldVal[0] !== val[0];
    })
    .toArray();

  const targetMap = parseToPropertyMap(target);

  const getStrategy = STRATEGIES[duplicatedKey];
  const get = (key: string, fallbackValue: string) =>
    getStrategy(targetMap, key, fallbackValue);

  return source
    .split(/\r?\n/)
    .map(line => {
      const matches = line.match(/^([ \t]*)"([^"]*)"( *: *)"(.*)"(,? *)$/);
      if (!matches) return line;

      const [, indent, key, colon, value, comma] = matches;
      if (changedKeys.includes(key)) return line;

      return `${indent}"${key}"${colon}"${get(key, value)}"${comma}`;
    })
    .join("\n");
};
