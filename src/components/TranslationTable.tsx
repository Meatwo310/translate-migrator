"use client";

import React, { useMemo, useState } from "react";
import { TranslationRow } from "@/utils/extractTranslationRows";
import { Filter, FilterX } from "lucide-react";

export type TranslationTableProps = {
  rows: TranslationRow[];
  newTranslations: Map<string, string>;
  onTranslationChange: (key: string, value: string, index: number) => void;
};

export function TranslationTable({
  rows,
  newTranslations,
  onTranslationChange,
}: TranslationTableProps) {
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);

  const filteredRows = useMemo(() => {
    if (!showOnlyChanged) return rows.map((row, index) => ({ ...row, index }));
    return rows
      .map((row, index) => ({ ...row, index }))
      .filter((row) => row.status === "added" || row.status === "changed");
  }, [rows, showOnlyChanged]);

  const changedCount = useMemo(
    () => rows.filter((row) => row.status === "added" || row.status === "changed").length,
    [rows],
  );

  const getRowKey = (row: TranslationRow, index: number) => `${row.key}-${index}`;

  return (
    <div className="translation-table-container">
      <div className="translation-table-header">
        <div className="translation-table-stats">
          <span className="stat-badge stat-total">計 {rows.length} キー</span>
          <span className="stat-badge stat-changed">変更/追加 {changedCount} 件</span>
        </div>
        <button
          type="button"
          onClick={() => setShowOnlyChanged(!showOnlyChanged)}
          className={`filter-toggle ${showOnlyChanged ? "active" : ""}`}
          title={showOnlyChanged ? "すべて表示" : "変更/追加のみ表示"}
        >
          {showOnlyChanged ? <FilterX size={16} /> : <Filter size={16} />}
          <span>{showOnlyChanged ? "すべて表示" : "変更/追加のみ"}</span>
        </button>
      </div>

      <div className="translation-table-wrapper">
        <table className="translation-table">
          <thead>
            <tr>
              <th className="col-key">キー</th>
              <th className="col-old-source">旧原語</th>
              <th className="col-new-source">新原語</th>
              <th className="col-target">既存翻訳</th>
              <th className="col-input">新規翻訳</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr
                key={getRowKey(row, row.index)}
                className={`status-${row.status}`}
              >
                <td className="col-key">
                  <code>{row.key}</code>
                </td>
                <td className="col-old-source">
                  {row.oldSourceValue ?? <span className="empty-value">—</span>}
                </td>
                <td className="col-new-source">{row.newSourceValue}</td>
                <td className="col-target">
                  {row.targetValue ?? <span className="empty-value">—</span>}
                </td>
                <td className="col-input">
                  <input
                    type="text"
                    value={newTranslations.get(getRowKey(row, row.index)) ?? ""}
                    onChange={(e) =>
                      onTranslationChange(row.key, e.target.value, row.index)
                    }
                    placeholder={row.targetValue || row.newSourceValue}
                    className="translation-input"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRows.length === 0 && (
        <div className="empty-state">
          {showOnlyChanged
            ? "変更または追加されたキーはありません"
            : "キーがありません"}
        </div>
      )}
    </div>
  );
}
