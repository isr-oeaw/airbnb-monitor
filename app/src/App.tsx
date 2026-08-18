import { useCallback, useState } from 'react';
import AboutModal from './components/AboutModal';
import AddressSearch from './components/AddressSearch';
import Datenschutz from './components/Datenschutz';
import Impressum from './components/Impressum';
import Methodology from './components/Methodology';
import InfoPanel from './components/InfoPanel';
import MapView from './components/MapView';
import ViewToggle from './components/ViewToggle';
import WienImpactMapView from './components/WienImpactMapView';
import type { GeocodingResult } from './lib/geocoding';
import {
  findBundeslandAtPoint,
  loadBundeslaender,
  WIEN_BUNDESLAND_ID,
} from './lib/geo';
import {
  findImpactHexAt,
  loadImpactHexes,
  loadImpactLegend,
} from './lib/impactHexes';
import { logAddressSearch } from './lib/searchLog';
import type { ImpactSample, PanelState, ViewMode } from './types/regulation';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('regulation');
  const [panel, setPanel] = useState<PanelState>(null);
  const [addressMarker, setAddressMarker] = useState<GeocodingResult | null>(null);
  const [impactSample, setImpactSample] = useState<ImpactSample | null>(null);
  const [showImpressum, setShowImpressum] = useState(false);
  const [showDatenschutz, setShowDatenschutz] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showAbout, setShowAbout] = useState(true);

  const selectedBundeslandId =
    panel?.mode === 'bundesland' || panel?.mode === 'address'
      ? panel.bundeslandId
      : null;

  const handleAddressSubmit = useCallback(
    async (result: GeocodingResult) => {
      setAddressMarker(result);
      logAddressSearch(result, viewMode);

      if (viewMode !== 'impact') {
        return;
      }

      try {
        const [geoData, hexes, legend] = await Promise.all([
          loadBundeslaender(),
          loadImpactHexes(),
          loadImpactLegend(),
        ]);
        const feature = findBundeslandAtPoint(geoData, result.lat, result.lng);

        if (feature?.properties.iso !== WIEN_BUNDESLAND_ID) {
          setImpactSample(null);
          setPanel({
            mode: 'impact-error',
            message: 'Impact Index nur für Wien verfügbar.',
          });
          return;
        }

        const sample = findImpactHexAt(hexes, legend, result.lat, result.lng);
        if (!sample) {
          setImpactSample(null);
          setPanel({
            mode: 'impact-error',
            message: 'Kein Impact-Index-Wert für diese Adresse verfügbar.',
          });
          return;
        }

        const enrichedSample: ImpactSample = {
          ...sample,
          address: result.label,
          coordinates: [result.lat, result.lng],
        };
        setImpactSample(enrichedSample);
        setPanel({
          mode: 'address',
          bundeslandId: WIEN_BUNDESLAND_ID,
          name: 'Wien',
          address: result.label,
          coordinates: [result.lat, result.lng],
        });
      } catch {
        setImpactSample(null);
        setPanel({
          mode: 'impact-error',
          message: 'Impact-Index-Daten konnten nicht geladen werden.',
        });
      }
    },
    [viewMode],
  );

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'impact') {
      setPanel({
        mode: 'bundesland',
        bundeslandId: WIEN_BUNDESLAND_ID,
        name: 'Wien',
      });
    } else {
      setImpactSample(null);
      setPanel(null);
    }
  }, []);

  const handleBundeslandSelect = useCallback((state: PanelState) => {
    setPanel(state);
  }, []);

  const handleAddressResolved = useCallback((state: PanelState) => {
    if (viewMode === 'regulation') {
      setPanel(state);
    }
  }, [viewMode]);

  const handleClosePanel = useCallback(() => {
    setPanel(null);
  }, []);

  const handleHexSelect = useCallback((sample: ImpactSample) => {
    setImpactSample(sample);
    setPanel((current) => {
      if (current?.mode === 'address') {
        return current;
      }
      return {
        mode: 'bundesland',
        bundeslandId: WIEN_BUNDESLAND_ID,
        name: 'Wien',
      };
    });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Airbnb Monitor</h1>
        <nav className="app-header-nav" aria-label="Seiteninformation">
          <button
            type="button"
            className="app-impressum-link"
            onClick={() => setShowAbout(true)}
          >
            Info
          </button>
          <button
            type="button"
            className="app-impressum-link"
            onClick={() => setShowMethodology(true)}
          >
            Methodik
          </button>
          <button
            type="button"
            className="app-impressum-link"
            onClick={() => setShowDatenschutz(true)}
          >
            Datenschutz
          </button>
          <button
            type="button"
            className="app-impressum-link"
            onClick={() => setShowImpressum(true)}
          >
            Impressum
          </button>
        </nav>
      </header>

      <main className="app-main">
        <div className="map-top-overlay">
          <ViewToggle mode={viewMode} onChange={handleViewModeChange} />
          <AddressSearch viewMode={viewMode} onSubmit={handleAddressSubmit} />
        </div>
        <a
          className="map-logo-badge"
          href="https://www.oeaw.ac.at/isr"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Österreichische Akademie der Wissenschaften – Institut für Stadt- und Regionalforschung"
        >
          <img
            className="map-logo-badge__oeaw"
            src="/logos/oeaw-logo-de.svg"
            alt=""
            width={120}
            height={36}
          />
          <img
            className="map-logo-badge__isr"
            src="/logos/isr-logo-akro.png"
            alt=""
            width={44}
            height={44}
          />
        </a>
        {viewMode === 'regulation' ? (
          <MapView
            selectedBundeslandId={selectedBundeslandId}
            addressMarker={addressMarker}
            onBundeslandSelect={handleBundeslandSelect}
            onAddressResolved={handleAddressResolved}
          />
        ) : (
          <WienImpactMapView
            addressMarker={addressMarker}
            impactSample={impactSample}
            onHexSelect={handleHexSelect}
          />
        )}
        <InfoPanel
          panel={panel}
          viewMode={viewMode}
          impactSample={impactSample}
          onClose={handleClosePanel}
        />
      </main>

      {showAbout && (
        <AboutModal
          onClose={() => setShowAbout(false)}
          onOpenDatenschutz={() => setShowDatenschutz(true)}
        />
      )}
      {showDatenschutz && <Datenschutz onClose={() => setShowDatenschutz(false)} />}
      {showMethodology && <Methodology onClose={() => setShowMethodology(false)} />}
      {showImpressum && <Impressum onClose={() => setShowImpressum(false)} />}
    </div>
  );
}

export default App;
