import { useEffect, useState } from 'react';
import { api, type CollectionItem, type CollectionKey } from './api';

// Cache module : les listes FFXIV Collect ne changent qu'aux patchs, inutile de les recharger à chaque page.
const cache = new Map<CollectionKey, Promise<CollectionItem[]>>();

/** Charge plusieurs collections ; renvoie celles déjà disponibles (les autres arrivent au fil de l'eau). */
export function useCollections(keys: readonly CollectionKey[]) {
  const [loaded, setLoaded] = useState<Partial<Record<CollectionKey, CollectionItem[]>>>({});
  const signature = keys.join(',');

  useEffect(() => {
    let cancelled = false;
    for (const key of signature.split(',') as CollectionKey[]) {
      load(key)
        .then((items) => !cancelled && setLoaded((prev) => ({ ...prev, [key]: items })))
        .catch(() => {
          // Erreur affichée sur la page dédiée ; ici la tuile reste simplement « … ».
        });
    }
    return () => {
      cancelled = true;
    };
  }, [signature]);

  return loaded;
}

function load(key: CollectionKey) {
  let promise = cache.get(key);
  if (!promise) {
    promise = api.collection(key);
    promise.catch(() => cache.delete(key));
    cache.set(key, promise);
  }
  return promise;
}

export function useCollection(key: CollectionKey) {
  const [items, setItems] = useState<CollectionItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    load(key)
      .then((data) => !cancelled && setItems(data))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { items, error };
}
