"use client";

import { useCallback, useEffect, useState } from "react";
import type { GenerationRecord } from "@/lib/ai/types";
import {
  deleteGeneration,
  generateId,
  getGenerations,
  saveGeneration,
  toggleFavorite,
} from "@/lib/storage";

export function useGenerations() {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);

  const refresh = useCallback(() => {
    setGenerations(getGenerations());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    (record: Omit<GenerationRecord, "id" | "createdAt">) => {
      const full: GenerationRecord = {
        ...record,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      saveGeneration(full);
      refresh();
      return full;
    },
    [refresh]
  );

  const toggleFav = useCallback(
    (id: string) => {
      toggleFavorite(id);
      refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      deleteGeneration(id);
      refresh();
    },
    [refresh]
  );

  return { generations, add, toggleFav, remove, refresh };
}
