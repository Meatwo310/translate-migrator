import { parse as parseJson, Visitor, JsonProperty } from "@anchan828/json-ast";

export type TranslationRow = {
  key: string;
  oldSourceValue?: string; // 旧翻訳元の値
  newSourceValue: string;  // 新翻訳元の値
  targetValue?: string;    // 既存翻訳の値
  status: "added" | "changed" | "unchanged";
};

type PropertyMap = Map<string, string[]>;

type DuplicatedKeyStrategy = "ignore" | "first" | "last" | "pop";
type SafeGetStrategy = (property: PropertyMap, key: string, fallbackValue: string) => string;

const COMMENT_KEY = "__COMMENT__";

const safePush = (propertyMap: PropertyMap, key: string, value: string) => {
  const property = propertyMap.get(key);
  if (property == null) {
    propertyMap.set(key, [value]);
  } else {
    property.push(value);
  }
};

// ==============================
// Lang parsing
// ==============================
const parseLangToPropertyMap = (content?: string | null): PropertyMap => {
  if (content == null) return new Map();

  const map: PropertyMap = new Map();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const commentMatch = line.match(/^\s*#(.*)$/);
    if (commentMatch) {
      const [, comment] = commentMatch;
      safePush(map, COMMENT_KEY, comment);
      continue;
    }

    const matches = line.match(/^[ \t]*([^#=\s][^=]*?)[ \t]*=[ \t]*(.*)$/);
    if (!matches) continue;

    const [, key, value] = matches;
    safePush(map, key, value);
  }

  return map;
};

type LangKeyValuePair = {
  key: string;
  value: string;
};

const parseLangToOrderedKeys = (content?: string | null): LangKeyValuePair[] => {
  if (content == null) return [];

  const result: LangKeyValuePair[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const commentMatch = line.match(/^\s*#(.*)$/);
    if (commentMatch) {
      const [, comment] = commentMatch;
      result.push({ key: COMMENT_KEY, value: comment });
      continue;
    }

    const matches = line.match(/^[ \t]*([^#=\s][^=]*?)[ \t]*=[ \t]*(.*)$/);
    if (!matches) continue;

    const [, key, value] = matches;
    result.push({ key, value });
  }

  return result;
};

// ==============================
// JSON parsing
// ==============================
class JsonKVVisitor extends Visitor {
  propertyMap: PropertyMap = new Map();
  orderedKeys: LangKeyValuePair[] = [];

  private safePush = (key: string, value: string) => {
    const property = this.propertyMap.get(key);
    if (property == null) {
      this.propertyMap.set(key, [value]);
    } else {
      property.push(value);
    }
    this.orderedKeys.push({ key, value });
  };

  property(propertyNode: JsonProperty) {
    const key = propertyNode.key.value;
    const value = propertyNode.value.value;
    if (typeof value !== "string") return;
    this.safePush(key, value);
  }
}

const parseJsonToPropertyMap = (content?: string | null): PropertyMap => {
  if (content == null) return new Map();
  const visitor = new JsonKVVisitor();
  visitor.visit(parseJson(content));
  return visitor.propertyMap;
};

const parseJsonToOrderedKeys = (content?: string | null): LangKeyValuePair[] => {
  if (content == null) return [];
  const visitor = new JsonKVVisitor();
  visitor.visit(parseJson(content));
  return visitor.orderedKeys;
};

// ==============================
// Strategies
// ==============================
const STRATEGIES: Record<DuplicatedKeyStrategy, SafeGetStrategy> = {
  ignore: (map, key, fallbackValue) => {
    const property = map.get(key);
    if (property == null || property.length !== 1) return fallbackValue;
    return property[0];
  },

  first: (map, key, fallbackValue) => {
    return map.get(key)?.[0] ?? fallbackValue;
  },

  last: (map, key, fallbackValue) => {
    const values = map.get(key);
    return values?.at(-1) ?? fallbackValue;
  },

  pop: (map, key, fallbackValue) => {
    const values = map.get(key);
    return values?.shift() ?? fallbackValue;
  },
};

// ==============================
// Main extraction function
// ==============================
export type ExtractTranslationRowsParams = {
  /** 古い翻訳元ファイル内容。 */
  oldSource?: string;
  /** 翻訳元ファイル内容。 */
  source: string;
  /** 翻訳先ファイル内容。 */
  target?: string;
  /** 重複するキーの処理方法。 */
  duplicatedKey: DuplicatedKeyStrategy;
  /** ファイル形式（lang または json）。 */
  format: "lang" | "json";
};

export function extractTranslationRows(params: ExtractTranslationRowsParams): TranslationRow[] {
  const { oldSource, source, target, duplicatedKey, format } = params;

  // Parse all sources
  const parseToPropertyMap = format === "lang" ? parseLangToPropertyMap : parseJsonToPropertyMap;
  const parseToOrderedKeys = format === "lang" ? parseLangToOrderedKeys : parseJsonToOrderedKeys;

  const oldSourceMap = parseToPropertyMap(oldSource);
  const targetMap = parseToPropertyMap(target);

  // Get ordered keys from source (new source)
  const orderedKeys = parseToOrderedKeys(source);

  const getStrategy = STRATEGIES[duplicatedKey];
  const missing = `__MISSING__${Math.random().toString(36).slice(2)}__`;

  const getFromMap = (map: PropertyMap, key: string): string | undefined => {
    const values = map.get(key);
    if (values == null || values.length === 0) return undefined;
    const value = getStrategy(map, key, missing);
    return value === missing ? undefined : value;
  };

  const rows: TranslationRow[] = [];
  const seenKeys = new Map<string, number>(); // Track index for duplicate key in same iteration

  for (const { key, value: newSourceValue } of orderedKeys) {
    // Skip comments for now in table view
    if (key === COMMENT_KEY) continue;

    const keyCount = seenKeys.get(key) ?? 0;
    seenKeys.set(key, keyCount + 1);

    const oldSourceValue = getFromMap(oldSourceMap, key);
    const targetValue = getFromMap(targetMap, key);

    let status: TranslationRow["status"];
    if (oldSourceValue === undefined) {
      // Key didn't exist in old source
      status = "added";
    } else if (oldSourceValue !== newSourceValue) {
      // Key existed but value changed
      status = "changed";
    } else {
      // Key existed and value is the same
      status = "unchanged";
    }

    rows.push({
      key,
      oldSourceValue,
      newSourceValue,
      targetValue,
      status,
    });
  }

  return rows;
}
