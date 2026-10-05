import { useEffect, useMemo, useState } from 'react';
import { ProgressBar } from '../components/ProgressBar';
import type { CollectionPageConfig } from '../data/pages';
import { useOwnership, useTracker } from '../store';
import { useCollection } from '../useCollection';

type StatusFilter = 'all' | 'owned' | 'missing';

const PAGE_SIZE = 150;

export function CollectionPage({ config }: { config: CollectionPageConfig }) {
  const { state, toggleCollected } = useTracker();
  const { items: allItems, error } = useCollection(config.key);
  const ownership = useOwnership(config.key);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [group, setGroup] = useState('');
  const [source, setSource] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Remise à zéro des filtres quand on change de page (le composant est réutilisé par le routeur).
  useEffect(() => {
    setQuery('');
    setStatus('all');
    setGroup('');
    setSource('');
  }, [config.path]);

  useEffect(() => setVisible(PAGE_SIZE), [config.path, query, status, group, source]);

  const items = useMemo(
    () => (allItems ?? []).filter((i) => !config.groups || (i.group !== null && config.groups.includes(i.group))),
    [allItems, config.groups],
  );

  const groups = useMemo(() => [...new Set(items.map((i) => i.group).filter((g): g is string => !!g))], [items]);
  const sourceTypes = useMemo(() => [...new Set(items.flatMap((i) => i.sources.map((s) => s.type)))].sort(), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q) && !item.details?.toLowerCase().includes(q)) return false;
      const owned = ownership(item) !== null;
      if (status === 'owned' && !owned) return false;
      if (status === 'missing' && owned) return false;
      if (group && item.group !== group) return false;
      if (source && !item.sources.some((s) => s.type === source)) return false;
      return true;
    });
  }, [items, query, status, group, source, ownership]);

  if (error) return <p className="error">Impossible de charger la liste : {error}</p>;
  if (!allItems) return <p>Chargement…</p>;

  const ownedCount = items.filter((i) => ownership(i) !== null).length;
  const unmatched = config.key === 'mounts' || config.key === 'minions' ? state.unmatched[config.key] : [];
  const usesAchievements = config.key === 'achievements' || items.some((i) => i.achievementId !== null);

  return (
    <section>
      <h1>{config.title}</h1>
      <ProgressBar value={ownedCount} max={items.length} />
      {config.description && <p className="hint">{config.description}</p>}
      {usesAchievements && state.achievementsAvailable === false && (
        <p className="warning">
          Tes succès ne sont pas publics sur le Lodestone : rien n'est coché automatiquement ici. Rends-les publics puis
          resynchronise, ou coche à la main.
        </p>
      )}

      {unmatched.length > 0 && (
        <details className="warning">
          <summary>{unmatched.length} élément(s) du Lodestone non reconnu(s) — à cocher à la main</summary>
          <p>{unmatched.join(', ')}</p>
        </details>
      )}

      <div className="filters">
        <input type="search" placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
          <option value="all">Tous</option>
          <option value="owned">Obtenus</option>
          <option value="missing">Manquants</option>
        </select>
        {groups.length > 1 && (
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}
        {sourceTypes.length > 1 && (
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">Toutes les sources</option>
            {sourceTypes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        <span className="filters__count">{filtered.length} résultat(s)</span>
      </div>

      <ul className="collection-grid">
        {filtered.slice(0, visible).map((item) => {
          const owned = ownership(item);
          const subtitle = [
            item.patch && `Patch ${item.patch}`,
            item.points !== undefined && `${item.points} pts`,
            item.sources[0]?.type,
            item.owned && `${item.owned} des joueurs`,
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <li key={item.id}>
              <label className={`collectible ${owned ? 'collectible--owned' : ''}`}>
                <input
                  type="checkbox"
                  checked={owned !== null}
                  disabled={owned === 'auto'}
                  title={owned === 'auto' ? 'Obtenu d’après tes succès Lodestone' : undefined}
                  onChange={() => toggleCollected(config.key, item.id)}
                />
                {item.icon ? (
                  <img src={item.icon} alt="" loading="lazy" width={40} height={40} />
                ) : (
                  <span className="collectible__placeholder" aria-hidden />
                )}
                <div className="collectible__body">
                  <span className="collectible__name">
                    {item.name}
                    {owned === 'auto' && <span className="tag tag--auto">auto</span>}
                  </span>
                  {item.details && <span className="collectible__details">{item.details}</span>}
                  <span className="collectible__meta">{subtitle}</span>
                  {item.sources[0] && <span className="collectible__source">{item.sources[0].text}</span>}
                  {item.reward && <span className="collectible__source">🎁 {item.reward}</span>}
                </div>
              </label>
            </li>
          );
        })}
      </ul>
      {filtered.length > visible && (
        <button type="button" className="ghost more" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
          Afficher plus ({filtered.length - visible} restants)
        </button>
      )}
    </section>
  );
}
