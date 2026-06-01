"use client";

import { useState } from "react";
import { deleteWeightRecord } from "@/actions/weight";
import { Button } from "@/components/ui/button";
import { WeightForm } from "./weight-form";

interface WeightRecord {
  id: string;
  date: Date;
  weightKg: number;
  notes: string | null;
  ma7?: number | null;
}

interface WeightTableProps {
  records: WeightRecord[];
}

export function WeightTable({ records }: WeightTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-zinc-500">
        暂无体重记录
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((record, i) =>
        editingId === record.id ? (
          <div
            key={record.id}
            className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3"
          >
            <WeightForm
              defaultValues={{
                id: record.id,
                date: new Date(record.date).toISOString().slice(0, 10),
                weightKg: Number(record.weightKg),
                notes: record.notes,
              }}
              onSuccess={() => setEditingId(null)}
            />
            <button
              onClick={() => setEditingId(null)}
              className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              取消
            </button>
          </div>
        ) : (
          <div
            key={record.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 w-16">
                {new Date(record.date).toLocaleDateString("zh-CN", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-lg font-bold text-white">
                {Number(record.weightKg).toFixed(1)}
                <span className="text-sm font-normal text-zinc-500"> kg</span>
              </span>
              {record.ma7 && (
                <span className="text-xs text-zinc-500">
                  MA7: {record.ma7.toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {record.notes && (
                <span className="mr-2 max-w-32 truncate text-xs text-zinc-600">
                  {record.notes}
                </span>
              )}
              <button
                onClick={() => setEditingId(record.id)}
                className="text-xs text-zinc-500 hover:text-white"
              >
                编辑
              </button>
              <button
                onClick={async () => {
                  if (confirm("确认删除此记录？")) {
                    await deleteWeightRecord(record.id);
                  }
                }}
                className="ml-1 text-xs text-red-500 hover:text-red-400"
              >
                删除
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
