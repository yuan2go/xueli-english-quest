import { useCallback, useEffect, useRef, useState } from "react";
import { checkAssets } from "../content/assets.ts";
import { IMAGES } from "../content/manifest.ts";
import { puzzle } from "../content/quest.ts";
export function useAssets(scene: string) {
  const [failed, setFailed] = useState<string[]>([]);
  const [epoch, setEpoch] = useState(0),
    [pending, setPending] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const loaded = useRef(new Set<string>());
  const requests = useRef(new Map<string, Promise<void>>());
  const controllers = useRef(new Set<AbortController>());
  const mounted = useRef(false);
  const report = useCallback((id: string) => {
    loaded.current.delete(id);
    setFailed((old) => (old.includes(id) ? old : [...old, id]));
  }, []);
  const load = useCallback(
    (id: string, reload = false) => {
      if (loaded.current.has(id)) return Promise.resolve();
      const pending = requests.current.get(id);
      if (pending) return pending;
      const controller = new AbortController();
      controllers.current.add(controller);
      setPending((n) => n + 1);
      const promise = checkAssets([id], controller.signal, reload)
        .then((errors) => {
          if (!mounted.current || controller.signal.aborted) return;
          if (errors.length) report(id);
          else {
            loaded.current.add(id);
            setFailed((old) => old.filter((x) => x !== id));
          }
        })
        .catch(() => {
          if (mounted.current && !controller.signal.aborted) report(id);
        })
        .finally(() => {
          controllers.current.delete(controller);
          if (requests.current.get(id) === promise) requests.current.delete(id);
          if (mounted.current) setPending((n) => Math.max(0, n - 1));
        });
      requests.current.set(id, promise);
      return promise;
    },
    [report],
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controllers.current.forEach((c) => c.abort());
      requests.current.clear();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const critical = ["cat"];
    const spec = puzzle(scene);
    const needed = new Set([
      ...Object.values(spec.initial.entities).map((e) => e.word),
      ...spec.rules.quotas.map((q) => q.word),
    ]);
    const props = IMAGES.filter((a) => needed.has(a.id) && a.id !== "cat");
    void Promise.all(critical.map((id) => load(id))).then(() => {
      if (cancelled) return;
      void Promise.all(props.map((a) => load(a.id)));
      timer = setTimeout(() => {
        if (!cancelled)
          void Promise.all(
            ["cat-thinking", "cat-action", "cat-happy"].map((id) => load(id)),
          );
      }, 800);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [scene, load]);
  const retry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await Promise.all(failed.map((id) => load(id, true)));
      if (mounted.current) setEpoch((n) => n + 1);
    } finally {
      if (mounted.current) setRetrying(false);
    }
  }, [failed, load, retrying]);
  return { failed, epoch, retrying, pending, report, retry };
}
