import { useState, type FormEvent } from 'react';
import { ProgressBar } from '../components/ProgressBar';
import { newId, useTracker, type CustomList } from '../store';

export function Lists() {
  const { state, updateLists } = useTracker();
  const [name, setName] = useState('');

  const addList = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    updateLists((lists) => [...lists, { id: newId(), name: trimmed, items: [] }]);
    setName('');
  };

  return (
    <section>
      <h1>Listes perso</h1>
      <p className="hint">
        Pour tout ce qui n'a pas de page dédiée : quêtes de rôle, armes reliques, triple triade, objectifs du moment…
      </p>
      <form className="inline-form" onSubmit={addList}>
        <input placeholder="Nouvelle liste (ex. Armes reliques)" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">Créer</button>
      </form>
      {state.lists.length === 0 && <p className="hint">Aucune liste pour l'instant.</p>}
      {state.lists.map((list) => (
        <ListCard key={list.id} list={list} />
      ))}
    </section>
  );
}

function ListCard({ list }: { list: CustomList }) {
  const { updateLists } = useTracker();
  const [label, setLabel] = useState('');
  const done = list.items.filter((i) => i.done).length;

  const update = (fn: (l: CustomList) => CustomList) =>
    updateLists((lists) => lists.map((l) => (l.id === list.id ? fn(l) : l)));

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    update((l) => ({ ...l, items: [...l.items, { id: newId(), label: trimmed, done: false }] }));
    setLabel('');
  };

  const rename = () => {
    const next = prompt('Nouveau nom de la liste', list.name)?.trim();
    if (next) update((l) => ({ ...l, name: next }));
  };

  const remove = () => {
    if (confirm(`Supprimer la liste « ${list.name} » ?`)) {
      updateLists((lists) => lists.filter((l) => l.id !== list.id));
    }
  };

  return (
    <div className="card list-card">
      <div className="list-card__header">
        <h2>{list.name}</h2>
        <div className="list-card__actions">
          <button type="button" className="ghost" onClick={rename}>Renommer</button>
          <button type="button" className="ghost danger" onClick={remove}>Supprimer</button>
        </div>
      </div>
      <ProgressBar value={done} max={list.items.length} />
      <ul className="checklist">
        {list.items.map((item) => (
          <li key={item.id} className={item.done ? 'checklist__item--done' : ''}>
            <label>
              <input
                type="checkbox"
                checked={item.done}
                onChange={() =>
                  update((l) => ({
                    ...l,
                    items: l.items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
                  }))
                }
              />
              {item.label}
            </label>
            <button
              type="button"
              className="ghost danger small"
              aria-label={`Retirer ${item.label}`}
              onClick={() => update((l) => ({ ...l, items: l.items.filter((i) => i.id !== item.id) }))}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={addItem}>
        <input placeholder="Ajouter un élément" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button type="submit">Ajouter</button>
      </form>
    </div>
  );
}
