"use client";

import { useState } from "react";
import { createWeightRecord, updateWeightRecord } from "@/actions/weight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WeightFormProps {
  onSuccess?: () => void;
  defaultValues?: {
    id: string;
    date: string;
    weightKg: number;
    notes: string | null;
  };
}

export function WeightForm({ onSuccess, defaultValues }: WeightFormProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEdit = !!defaultValues;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = isEdit
      ? await updateWeightRecord(defaultValues!.id, formData)
      : await createWeightRecord(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    if (!isEdit) {
      (e.target as HTMLFormElement).reset();
    }
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-zinc-300 text-xs">
            日期
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={
              defaultValues?.date ?? new Date().toISOString().slice(0, 10)
            }
            className="border-zinc-700 bg-zinc-800 text-white text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weightKg" className="text-zinc-300 text-xs">
            体重 (kg)
          </Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            step="0.1"
            placeholder="115.0"
            defaultValue={defaultValues?.weightKg ?? ""}
            className="border-zinc-700 bg-zinc-800 text-white text-sm"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-zinc-300 text-xs">
          备注 <span className="text-zinc-600">(可选)</span>
        </Label>
        <Input
          id="notes"
          name="notes"
          placeholder="如：昨晚吃咸了、训练后称重..."
          defaultValue={defaultValues?.notes ?? ""}
          className="border-zinc-700 bg-zinc-800 text-white text-sm"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black hover:bg-zinc-200"
        size="sm"
      >
        {loading ? "保存中..." : isEdit ? "更新体重" : "记录体重"}
      </Button>
    </form>
  );
}
