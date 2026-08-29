"use client";

// Estado do editor: documento + histórico (desfazer/refazer) + rascunho
// automático no localStorage. Operações estruturais (redimensionar, remover
// fio, importar) entram no histórico; edição de nome/cor de fio não entra —
// senão cada letra digitada viraria um passo de "desfazer".

import { useCallback, useEffect, useRef, useState } from "react";
import { CRAFTS, type CraftSpec } from "@/lib/chart-editor/crafts";
import {
  createDoc,
  fromJson,
  MAX_HISTORY,
  toJson,
  type ChartDoc,
  type Craft,
} from "@/lib/chart-editor/model";

interface History {
  past: ChartDoc[];
  future: ChartDoc[];
}

export function defaultDoc(spec: CraftSpec): ChartDoc {
  return createDoc(spec.key, {
    cols: spec.defaultSize.cols,
    rows: spec.defaultSize.rows,
    gauge: spec.defaultGauge,
    yarns: spec.defaultYarns,
  });
}

function loadDraft(spec: CraftSpec): ChartDoc | null {
  try {
    const raw = localStorage.getItem(spec.storageKey);
    if (!raw) return null;
    return fromJson(JSON.parse(raw), spec.key);
  } catch {
    return null;
  }
}

export function useChartDoc(craft: Craft) {
  const spec = CRAFTS[craft];
  const [doc, setDocState] = useState<ChartDoc>(() => defaultDoc(spec));
  const [ready, setReady] = useState(false);
  const history = useRef<History>({ past: [], future: [] });
  const [historyVersion, setHistoryVersion] = useState(0);

  // Rascunho: carrega DEPOIS da hidratação (o servidor não tem localStorage).
  useEffect(() => {
    const draft = loadDraft(spec);
    if (draft) setDocState(draft);
    setReady(true);
  }, [spec]);

  // Autosave com debounce.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(spec.storageKey, JSON.stringify(toJson(doc)));
      } catch {
        /* quota cheia ou modo privado: segue sem rascunho */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [doc, ready, spec]);

  const bump = () => setHistoryVersion((v) => v + 1);

  /** Guarda o estado atual como passo do histórico (chame ANTES de mudar). */
  const checkpoint = useCallback((current: ChartDoc) => {
    const h = history.current;
    h.past.push(current);
    if (h.past.length > MAX_HISTORY) h.past.shift();
    h.future = [];
    bump();
  }, []);

  /** Aplica uma mudança; `record` decide se entra no histórico. */
  const update = useCallback(
    (fn: (d: ChartDoc) => ChartDoc, record = true) => {
      setDocState((current) => {
        const next = fn(current);
        if (next === current) return current;
        if (record) checkpoint(current);
        return next;
      });
    },
    [checkpoint],
  );

  /** Substitui o documento inteiro (abrir arquivo, importar, novo). */
  const replace = useCallback(
    (next: ChartDoc) => {
      setDocState((current) => {
        checkpoint(current);
        return next;
      });
    },
    [checkpoint],
  );

  const undo = useCallback(() => {
    const h = history.current;
    const prev = h.past.pop();
    if (!prev) return;
    setDocState((current) => {
      h.future.push(current);
      return prev;
    });
    bump();
  }, []);

  const redo = useCallback(() => {
    const h = history.current;
    const next = h.future.pop();
    if (!next) return;
    setDocState((current) => {
      h.past.push(current);
      return next;
    });
    bump();
  }, []);

  const reset = useCallback(() => {
    replace(defaultDoc(spec));
  }, [replace, spec]);

  return {
    spec,
    doc,
    ready,
    update,
    replace,
    checkpoint,
    undo,
    redo,
    reset,
    canUndo: history.current.past.length > 0,
    canRedo: history.current.future.length > 0,
    // usado só pra forçar re-render dos botões de desfazer/refazer
    historyVersion,
  };
}

export type ChartDocApi = ReturnType<typeof useChartDoc>;
