type PropertyMap = Map<string, string[]>;
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

const parseToPropertyMap = (content?: string | null): PropertyMap => {
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

export type PatchLangParams = {
	/** 古い翻訳元langファイル。 */
	oldSource?: string;

	/** 翻訳元langファイル。 */
	source: string;

	/** 翻訳先langファイル。 */
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

const STRATEGIES: Record<PatchLangParams["duplicatedKey"], SafeGetStrategy> = {
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

export const patchLang = (
  {oldSource, source, target, duplicatedKey}: PatchLangParams,
) => {
  const oldSourceMap = parseToPropertyMap(oldSource);
  const sourceMap = parseToPropertyMap(source);
  const duplicatedSourceKeys = new Set(
    Array.from(sourceMap.entries())
      .filter(([, values]) => values.length > 1)
      .map(([key]) => key),
  );

  const changedKeys = Array.from(oldSourceMap.keys())
    .filter(key => {
      const oldVal = oldSourceMap.get(key);
      const val = sourceMap.get(key);
      return oldVal?.length === 1
				&& oldVal.length === val?.length
				&& oldVal[0] !== val[0];
    });

  const targetMap = parseToPropertyMap(target);
  const getStrategy = STRATEGIES[duplicatedKey];
  const get = (key: string, fallbackValue: string) => getStrategy(targetMap, key, fallbackValue);

  return source
    .split(/\r?\n/)
    .map(line => {
      const commentMatch = line.match(/^([ \t]*)#(.*)$/);
      if (commentMatch) {
        const [, indent, comment] = commentMatch;
        if (changedKeys.includes(COMMENT_KEY) || (duplicatedKey === "ignore" && duplicatedSourceKeys.has(COMMENT_KEY))) {
          return line;
        }
        return `${indent}#${get(COMMENT_KEY, comment)}`;
      }

      const matches = line.match(/^([ \t]*)([^#=\s][^=]*?)([ \t]*=[ \t]*)(.*)$/);
      if (!matches) return line;

      const [, indent, key, separator, value] = matches;
      if (changedKeys.includes(key) || duplicatedKey === "ignore" && duplicatedSourceKeys.has(key)) {
        return line;
      }

      return `${indent}${key}${separator}${get(key, value)}`;
    })
    .join("\n");
};
