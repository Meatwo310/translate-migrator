/**
 * JSONオブジェクト間の差分を検出し、パッチを適用するユーティリティクラス
 */
const PowerDiff = class {
  /**
   * PowerDiffインスタンスを初期化する
   * @param oldJson {string|object} - 比較元のJSON文字列/オブジェクト
   * @param newJson {string|object} - 比較先のJSON文字列/オブジェクト
   */
  constructor(oldJson, newJson) {
    this.oldObj = PowerDiff.jsonize(oldJson);
    this.newObj = PowerDiff.jsonize(newJson);
  }

  /**
   * oldObjとnewObjの両方に存在するキーのうち、値が変更されたもののみを返す
   * @returns {object} 変更されたキーと新しい値のペアを含むオブジェクト
   */
  getChangedValues() {
    const modified = {};
    Object.keys(this.newObj).forEach((key) => {
      if (this.oldObj[key] !== this.newObj[key]) {
        modified[key] = this.newObj[key];
      }
    });
    return modified;
  }

  /**
   * newObjをpatchで上書きする。
   * oldObjからnewObjにかけて値が変更されている場合は、patchは無視されnewObjの値が使用される。
   * patchに存在しない値はnewObjの値をそのまま使用する。
   * @param patchObj {string|object} - 適用するパッチデータ
   * @returns {object} - パッチを適用した新しいオブジェクト
   */
  applyPatch(patchObj) {
    const patch = PowerDiff.jsonize(patchObj);
    const modified = this.getChangedValues();

    const patchedObj = {};
    Object.entries(this.newObj).forEach(([key, value]) => {
      if (key in modified) {
        // 元データの変更によりパッチが古くなっている場合は元データを優先
        patchedObj[key] = value;
      } else if (key in patch) {
        // 元データに変更がなくパッチをそのまま適用できる場合はパッチを適用
        patchedObj[key] = patch[key];
      } else {
        // 元データのまま翻訳されていない場合は元データを使用
        patchedObj[key] = value;
      }
    });
    return patchedObj;
  }

  /**
   * objがJSONオブジェクトかどうか検証し、シャローコピーを返す。
   * 文字列が与えられた場合はJSONへパースして返す。
   * @param {string|object} obj - 変換対象のデータ
   * @returns {object} 変換されたJSONオブジェクト
   * @throws {PowerDiff.InvalidJsonFormatError} JSONオブジェクトの構造が不正な場合
   * @throws {SyntaxError} JSON文字列のパースに失敗した場合
   */
  static jsonize(obj) {
    const result = typeof obj === 'string' ? JSON.parse(obj) : { ...obj };
    return PowerDiff.hasOnlyStringOrThrow(result);
  }

  /**
   * オブジェクト内の全要素が文字列であるか確認する
   * @param {object} obj - 検証対象のオブジェクト
   * @returns {boolean} - オブジェクトが存在し、かつすべての値が文字列の場合はtrue、そうでない場合はfalse
   */
  static hasOnlyString(obj) {
    return typeof obj === 'object' && Object.values(obj).every(value => typeof value === 'string');
  }

  /**
   * オブジェクト内の全要素が文字列であるか確認し、そうでない場合はエラーをスローする
   * @param obj {object} - 検証対象のオブジェクト
   * @returns {object} - 与えられたオブジェクト
   * @throws {PowerDiff.InvalidJsonFormatError} - JSONオブジェクトの構造が不正な場合
   */
  static hasOnlyStringOrThrow(obj) {
    if (!PowerDiff.hasOnlyString(obj)) {
      throw new PowerDiff.InvalidJsonFormatError('Object must be a JSON object with string values only');
    }
    return obj;
  }

  static InvalidJsonFormatError = class extends SyntaxError {}
}

Object.freeze(PowerDiff);
Object.freeze(PowerDiff.prototype);
export default PowerDiff;
