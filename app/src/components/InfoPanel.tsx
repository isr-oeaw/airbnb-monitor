import { useEffect, useState } from 'react';
import { getRegulation } from '../lib/regulations';
import {
  getTrendForH3,
  loadH3ListingsTrend,
  type LoadedListingsTrend,
  type TrendPoint,
} from '../lib/h3ListingsTrend';
import {
  getIndicatorsForH3,
  getRadarValues,
  hasListingActivity,
  loadH3Indicators,
  type H3Indicators,
  type IndicatorMaxima,
  type LoadedIndicators,
} from '../lib/h3Indicators';
import {
  ehsaTypeLabel,
  getLegendEntry,
  legendEntries,
  loadImpactLegend,
  type ImpactLegend,
} from '../lib/impactHexes';
import SpiderChart from './SpiderChart';
import TrendLineChart from './TrendLineChart';
import type { ImpactSample, PanelState, ViewMode } from '../types/regulation';

interface InfoPanelProps {
  panel: PanelState;
  viewMode: ViewMode;
  impactSample: ImpactSample | null;
  onClose: () => void;
}

function EhsaLegendList({
  legend,
  selectedType,
}: {
  legend: ImpactLegend;
  selectedType?: string | null;
}) {
  return (
    <ul className="info-panel__legend-list">
      {legendEntries(legend).map((entry) => {
        const isSelected = selectedType === entry.type;
        return (
          <li
            key={entry.type}
            className={`info-panel__legend-item${isSelected ? ' info-panel__legend-item--selected' : ''}`}
          >
            <span
              className="info-panel__legend-swatch"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <div className="info-panel__legend-text">
              <span className="info-panel__legend-label">{entry.label}</span>
              <span className="info-panel__legend-description">{entry.description}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function H3IndicatorsSection({
  indicators,
  maxima,
  trend,
}: {
  indicators: H3Indicators;
  maxima: IndicatorMaxima;
  trend: TrendPoint[];
}) {
  const axes = getRadarValues(indicators, maxima);
  const quarterLabel = indicators.quarter.replace('Q', ' Q');
  const firstYear = trend[0]?.year ?? 2017;
  const lastYear = trend[trend.length - 1]?.year ?? 2026;

  return (
    <section className="info-panel__section">
      <h3>Kennzahlen ({quarterLabel})</h3>
      {!hasListingActivity(indicators) && (
        <p className="info-panel__indicators-empty">Keine Listings in dieser Zelle.</p>
      )}
      <SpiderChart axes={axes} />
      <h4 className="info-panel__subsection-title">Listings {firstYear}–{lastYear}</h4>
      <TrendLineChart data={trend} />
    </section>
  );
}

export default function InfoPanel({
  panel,
  viewMode,
  impactSample,
  onClose,
}: InfoPanelProps) {
  const [legend, setLegend] = useState<ImpactLegend | null>(null);
  const [indicatorData, setIndicatorData] = useState<LoadedIndicators | null>(null);
  const [trendData, setTrendData] = useState<LoadedListingsTrend | null>(null);

  useEffect(() => {
    if (viewMode !== 'impact') return;
    loadImpactLegend()
      .then(setLegend)
      .catch(() => setLegend(null));
    loadH3Indicators()
      .then(setIndicatorData)
      .catch(() => setIndicatorData(null));
    loadH3ListingsTrend()
      .then(setTrendData)
      .catch(() => setTrendData(null));
  }, [viewMode]);

  if (!panel) return null;

  if (panel.mode === 'impact-error') {
    return (
      <aside className="info-panel" aria-live="polite">
        <header className="info-panel__header">
          <h2 className="info-panel__title">Impact Index</h2>
          <button
            type="button"
            className="info-panel__close"
            onClick={onClose}
            aria-label="Schließen"
          >
            ×
          </button>
        </header>
        <section className="info-panel__section">
          <p>{panel.message}</p>
        </section>
      </aside>
    );
  }

  const regulation = getRegulation(panel.bundeslandId);
  const showImpactContent = viewMode === 'impact';
  const sample = showImpactContent ? impactSample : null;
  const selectedEntry = sample && legend ? getLegendEntry(legend, sample.ehsaType) : null;
  const cellIndicators =
    sample && indicatorData ? getIndicatorsForH3(indicatorData, sample.h3) : null;
  const cellTrend =
    sample && trendData ? getTrendForH3(trendData, sample.h3) : null;

  return (
    <aside className="info-panel" aria-live="polite">
      <header className="info-panel__header">
        <div>
          <h2 className="info-panel__title">
            {panel.mode === 'address' ? panel.address : panel.name}
          </h2>
          {panel.mode === 'address' && (
            <p className="info-panel__subtitle">{panel.name}</p>
          )}
        </div>
        <button
          type="button"
          className="info-panel__close"
          onClick={onClose}
          aria-label="Schließen"
        >
          ×
        </button>
      </header>

      {showImpactContent ? (
        <>
          {sample ? (
            <>
              <section className="info-panel__section">
                <h3>Impact Index (EHSA)</h3>
                <div className="info-panel__impact-type">
                  <span
                    className="info-panel__impact-swatch"
                    style={{ backgroundColor: sample.color }}
                    aria-hidden="true"
                  />
                  <div className="info-panel__impact-text">
                    <p className="info-panel__impact-label">
                      {ehsaTypeLabel(sample.ehsaType, legend)}
                    </p>
                    {selectedEntry && (
                      <p className="info-panel__impact-description">
                        {selectedEntry.description}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {cellIndicators && indicatorData && cellTrend && (
                <H3IndicatorsSection
                  indicators={cellIndicators}
                  maxima={indicatorData.maxima}
                  trend={cellTrend}
                />
              )}

              {legend && (
                <section className="info-panel__section">
                  <h3>Legende</h3>
                  <EhsaLegendList legend={legend} selectedType={sample.ehsaType} />
                </section>
              )}
            </>
          ) : (
            <section className="info-panel__section">
              <h3>Impact Index (Wien)</h3>
              <p>
                Klicken Sie auf eine Fläche oder suchen Sie eine Wiener Adresse,
                um die Airbnb-Auswirkungen und Kennzahlen für dieses Gebiet anzuzeigen.
              </p>
              {legend && <EhsaLegendList legend={legend} />}
            </section>
          )}
        </>
      ) : (
        <>
          <section className="info-panel__section">
            <h3>Airbnb-Auswirkungen</h3>
            <p>{regulation.airbnbImpact}</p>
          </section>

          <section className="info-panel__section">
            <h3>Regulierung</h3>
            <p>{regulation.regulationSummary}</p>
            <ul className="info-panel__rules">
              {regulation.keyRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>

          {regulation.sources.length > 0 && (
            <section className="info-panel__section">
              <h3>Quellen</h3>
              <ul className="info-panel__sources">
                {regulation.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer className="info-panel__footer">
            Stand: {regulation.lastUpdated}
          </footer>
        </>
      )}
    </aside>
  );
}
