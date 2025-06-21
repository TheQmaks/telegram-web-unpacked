import { untrack, createSignal, useTransition, createComputed, batch, createMemo, $TRACK } from 'solid-js';
import { isServer } from 'solid-js/web';

// src/index.ts
var noop = () => {
};
var noopTransition = (el, done) => done();
function createSwitchTransition(source, options) {
  const initSource = untrack(source);
  const initReturned = initSource ? [initSource] : [];
  if (isServer) {
    return () => initReturned;
  }
  const { onEnter = noopTransition, onExit = noopTransition } = options;
  const [returned, setReturned] = createSignal(
    options.appear ? [] : initReturned
  );
  const [isTransitionPending] = useTransition();
  let next;
  let isExiting = false;
  function exitTransition(el, after) {
    if (!el)
      return after && after();
    isExiting = true;
    onExit(el, () => {
      batch(() => {
        isExiting = false;
        setReturned((p) => p.filter((e) => e !== el));
        after && after();
      });
    });
  }
  function enterTransition(after) {
    const el = next;
    if (!el)
      return after && after();
    next = void 0;
    setReturned((p) => [el, ...p]);
    onEnter(el, after ?? noop);
  }
  const triggerTransitions = options.mode === "out-in" ? (
    // exit -> enter
    (prev) => isExiting || exitTransition(prev, enterTransition)
  ) : options.mode === "in-out" ? (
    // enter -> exit
    (prev) => enterTransition(() => exitTransition(prev))
  ) : (
    // exit & enter
    (prev) => {
      exitTransition(prev);
      enterTransition();
    }
  );
  createComputed(
    (prev) => {
      const el = source();
      if (untrack(isTransitionPending)) {
        isTransitionPending();
        return prev;
      }
      if (el !== prev) {
        next = el;
        batch(() => untrack(() => triggerTransitions(prev)));
      }
      return el;
    },
    options.appear ? void 0 : initSource
  );
  return returned;
}
function createListTransition(source, options) {
  const initSource = untrack(source);
  if (isServer) {
    const copy = initSource.slice();
    return () => copy;
  }
  const { onChange } = options;
  let prevSet = new Set(options.appear ? void 0 : initSource);
  const exiting = /* @__PURE__ */ new WeakSet();
  const [toRemove, setToRemove] = createSignal([], { equals: false });
  const [isTransitionPending] = useTransition();
  const finishRemoved = options.exitMethod === "remove" ? noop : (els) => {
    setToRemove((p) => (p.push.apply(p, els), p));
    for (const el of els)
      exiting.delete(el);
  };
  const handleRemoved = options.exitMethod === "remove" ? noop : options.exitMethod === "keep-index" ? (els, el, i) => els.splice(i, 0, el) : (els, el) => els.push(el);
  return createMemo(
    (prev) => {
      const elsToRemove = toRemove();
      const sourceList = source();
      sourceList[$TRACK];
      if (untrack(isTransitionPending)) {
        isTransitionPending();
        return prev;
      }
      if (elsToRemove.length) {
        const next = prev.filter((e) => !elsToRemove.includes(e));
        elsToRemove.length = 0;
        onChange({ list: next, added: [], removed: [], unchanged: next, finishRemoved });
        return next;
      }
      return untrack(() => {
        const nextSet = new Set(sourceList);
        const next = sourceList.slice();
        const added = [];
        const removed = [];
        const unchanged = [];
        for (const el of sourceList) {
          (prevSet.has(el) ? unchanged : added).push(el);
        }
        let nothingChanged = !added.length;
        for (let i = 0; i < prev.length; i++) {
          const el = prev[i];
          if (!nextSet.has(el)) {
            if (!exiting.has(el)) {
              removed.push(el);
              exiting.add(el);
            }
            handleRemoved(next, el, i);
          }
          if (nothingChanged && el !== next[i])
            nothingChanged = false;
        }
        if (!removed.length && nothingChanged)
          return prev;
        onChange({ list: next, added, removed, unchanged, finishRemoved });
        prevSet = nextSet;
        return next;
      });
    },
    options.appear ? [] : initSource.slice()
  );
}

export { createListTransition, createSwitchTransition };
