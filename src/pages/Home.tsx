import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, type CharacterSummary } from '../api';
import { ProgressBar } from '../components/ProgressBar';
import { isRoutineDone } from '../data/routines';
import { migrate, useTracker } from '../store';
import { globalProgress, useProgress, type CategoryProgress, type ProgressSection } from '../useProgress';

export function Home() {
  const { state } = useTracker();
  return (
    <section>
      <h1>Ma progression</h1>
      {state.character ? <CharacterCard /> : <CharacterSetup />}
      <Overview />
      <Backup />
    </section>
  );
}

function CharacterSetup() {
  const { setCharacter } = useTracker();
  const [name, setName] = useState('');
  const [world, setWorld] = useState('');
  const [idOrUrl, setIdOrUrl] = useState('');
  const [results, setResults] = useState<CharacterSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setResults(await api.search(name.trim(), world.trim()));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submitId = (e: FormEvent) => {
    e.preventDefault();
    const id = idOrUrl.match(/(\d{5,})/)?.[1];
    if (!id) return setError('Colle une URL Lodestone ou un ID numérique.');
    setCharacter({ id, name: `Personnage ${id}`, world: '', avatar: null });
  };

  return (
    <div className="card">
      <h2>Lier ton personnage (optionnel)</h2>
      <p className="hint">
        Permet de récupérer automatiquement tes niveaux, montures, mascottes et succès depuis le Lodestone (succès :
        à rendre publics dans les paramètres du Lodestone).
      </p>
      <form className="inline-form" onSubmit={search}>
        <input placeholder="Nom du personnage" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Monde (ex. Phoenix)" value={world} onChange={(e) => setWorld(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Recherche…' : 'Rechercher'}</button>
      </form>
      <form className="inline-form" onSubmit={submitId}>
        <input
          placeholder="…ou URL / ID Lodestone"
          value={idOrUrl}
          onChange={(e) => setIdOrUrl(e.target.value)}
        />
        <button type="submit">Utiliser</button>
      </form>
      {error && <p className="error">{error}</p>}
      {results && results.length === 0 && <p className="hint">Aucun personnage trouvé.</p>}
      {results && results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.id}>
              <button type="button" className="search-result" onClick={() => setCharacter(r)}>
                {r.avatar && <img src={r.avatar} alt="" width={40} height={40} />}
                <span>
                  <strong>{r.name}</strong>
                  <br />
                  <small>{r.world}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CharacterCard() {
  const { state, applySync, setCharacter } = useTracker();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const character = state.character!;

  const sync = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await api.sync(character.id);
      applySync(result);
      const describe = (o: typeof result.mounts, label: string) =>
        o.available ? `${o.ids.length} ${label}` : `${label} non accessibles (vides ou privées)`;
      setMessage(
        `Synchro OK : ${result.jobs.filter((j) => j.level > 0).length} classes, ` +
          `${describe(result.mounts, 'montures')}, ${describe(result.minions, 'mascottes')}, ` +
          (result.achievements.available
            ? `${result.achievements.ids.length} succès.`
            : 'succès non accessibles (rends-les publics sur le Lodestone).'),
      );
    } catch (err) {
      setMessage(`Échec : ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card character">
      {character.avatar && <img className="character__avatar" src={character.avatar} alt="" />}
      <div className="character__info">
        <h2>{character.name}</h2>
        <p>{character.world}</p>
        <p className="hint">
          {state.lastSync ? `Dernière synchro : ${new Date(state.lastSync).toLocaleString('fr-FR')}` : 'Jamais synchronisé'}
        </p>
        {message && <p className="hint">{message}</p>}
      </div>
      <div className="character__actions">
        <button type="button" onClick={sync} disabled={loading}>
          {loading ? 'Synchronisation… (jusqu’à ~1 min)' : 'Synchroniser avec le Lodestone'}
        </button>
        <a className="ghost button" href={`https://fr.finalfantasyxiv.com/lodestone/character/${character.id}/`} target="_blank" rel="noreferrer">
          Voir sur le Lodestone
        </a>
        <button type="button" className="ghost" onClick={() => setCharacter(null)}>
          Changer de personnage
        </button>
      </div>
    </div>
  );
}

function Tile({ to, title, value, max }: { to: string; title: string; value: number; max: number | null }) {
  return (
    <Link to={to} className="card tile">
      <h3>{title}</h3>
      <p className="tile__value">
        {value} <small>/ {max ?? '…'}</small>
      </p>
      <ProgressBar value={value} max={max ?? 0} label=" " />
    </Link>
  );
}

const SECTIONS: ProgressSection[] = ['Personnage', 'Combat', 'Collections', 'Listes perso'];

function GlobalProgress({ categories }: { categories: CategoryProgress[] }) {
  const { percent, counted, pending } = globalProgress(categories);
  return (
    <div className="card global-progress">
      <div className="global-progress__value">
        {percent.toFixed(1).replace('.', ',')} %
        {pending && <small> (calcul…)</small>}
      </div>
      <div className="global-progress__body">
        <h2>Progression globale</h2>
        <div className="global-progress__bar">
          <ProgressBar value={Math.round(percent * 10)} max={1000} label=" " />
        </div>
        <p className="hint">
          Moyenne des {counted} catégories ci-dessous (chacune compte autant), hors hebdo &amp; quotidien et hors
          « Succès » (qui recouvre les autres catégories).
        </p>
      </div>
    </div>
  );
}

function Overview() {
  const { state } = useTracker();
  const categories = useProgress();
  const routinesDone = state.routines.filter((r) => isRoutineDone(r)).length;

  return (
    <>
      <GlobalProgress categories={categories} />
      <h2 className="section-title">Routine</h2>
      <div className="overview">
        <Tile to="/routine" title="Hebdo & quotidien" value={routinesDone} max={state.routines.length} />
      </div>
      {SECTIONS.map((section) => {
        const tiles = categories.filter((c) => c.section === section);
        if (!tiles.length) return null;
        return (
          <div key={section}>
            <h2 className="section-title">{section}</h2>
            <div className="overview">
              {tiles.map((c) => (
                <Tile key={c.id} to={c.to} title={c.title} value={c.value} max={c.max} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

function Backup() {
  const { state, replaceState } = useTracker();
  const fileInput = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ff-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = migrate(JSON.parse(await file.text()));
      if (confirm('Remplacer toute ta progression actuelle par ce fichier ?')) replaceState(data);
    } catch (err) {
      alert(`Import impossible : ${(err as Error).message}`);
    }
  };

  return (
    <div className="card backup">
      <h2>Sauvegarde</h2>
      <p className="hint">Les données sont stockées dans ce navigateur. Exporte-les régulièrement.</p>
      <div className="inline-form">
        <button type="button" onClick={exportData}>Exporter (JSON)</button>
        <button type="button" className="ghost" onClick={() => fileInput.current?.click()}>Importer…</button>
        <input ref={fileInput} type="file" accept="application/json" hidden onChange={importData} />
      </div>
    </div>
  );
}
