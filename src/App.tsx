import { NavLink, Route, Routes } from 'react-router-dom';
import { COLLECTION_PAGES, NAV } from './data/pages';
import { CollectionPage } from './pages/CollectionPage';
import { Home } from './pages/Home';
import { Jobs } from './pages/Jobs';
import { Lists } from './pages/Lists';
import { Ranks } from './pages/Ranks';
import { Relics } from './pages/Relics';
import { Routines } from './pages/Routines';
import { Tribes } from './pages/Tribes';
import { useTracker } from './store';

export function App() {
  const { state } = useTracker();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="header__logo">✦</span> FF Tracker
        </div>
        {state.character && (
          <div className="sidebar__char">
            {state.character.avatar && <img src={state.character.avatar} alt="" />}
            <span>{state.character.name}</span>
          </div>
        )}
        <nav className="nav">
          {NAV.map((section) => (
            <div key={section.title || 'main'} className="nav__section">
              {section.title && <h3 className="nav__title">{section.title}</h3>}
              {section.links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.to === '/'} className="nav__link">
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/routine" element={<Routines />} />
          <Route path="/classes" element={<Jobs />} />
          <Route path="/tribus" element={<Tribes />} />
          <Route path="/rangs" element={<Ranks />} />
          <Route path="/reliques" element={<Relics />} />
          <Route path="/listes" element={<Lists />} />
          {Object.values(COLLECTION_PAGES).map((config) => (
            <Route key={config.path} path={config.path} element={<CollectionPage config={config} />} />
          ))}
          <Route path="*" element={<p>Page introuvable.</p>} />
        </Routes>
      </main>
    </div>
  );
}
