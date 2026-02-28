import { useState } from 'react';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { RightPanel } from './components/layout/RightPanel';
import { CurveOverlayEditor } from './components/curves/CurveOverlayEditor';
import { PalettePreview } from './components/preview/PalettePreview';
import { PaletteColorWheel } from './components/visualize/PaletteColorWheel';
import { ExportModal } from './components/export/ExportModal';
import { StepListModal } from './components/steps/StepListModal';
import { BulkCreatePanel } from './components/setup/BulkCreatePanel';
import { usePaletteStore, selectActiveScale } from './store/paletteStore';
import { useGeneratedRamp } from './hooks/useGeneratedRamp';
import type { ColorScale } from './types/palette';

type AppMode = 'edit' | 'preview' | 'visualize';
type AppTheme = 'light' | 'dark';

function EditPanel({ scale }: { scale: ColorScale }) {
  const ramp = useGeneratedRamp(scale);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const activeStep = activeStepIndex !== null ? (ramp.steps[activeStepIndex] ?? null) : null;

  function handleStepClick(i: number) {
    setActiveStepIndex((prev) => (prev === i ? null : i));
  }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <CurveOverlayEditor
        scale={scale}
        ramp={ramp}
        activeStepIndex={activeStepIndex}
        onStepClick={handleStepClick}
      />
      <RightPanel key={scale.id} scale={scale} activeStep={activeStep} />
    </div>
  );
}

export default function App() {
  const [showExport, setShowExport] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showLightness, setShowLightness] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [mode, setMode] = useState<AppMode>('edit');
  const [theme, setTheme] = useState<AppTheme>('light');
  const scale = usePaletteStore(selectActiveScale);
  const scales = usePaletteStore((s) => s.scales);

  async function handleSave() {
    setSaveStatus('saving');
    try {
      const state = usePaletteStore.getState();
      const payload = {
        version: 1,
        activeScaleId: state.activeScaleId,
        scales: state.scales,
      };
      const res = await fetch('/__save-color-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload, null, 2),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  return (
    <div
      data-theme={theme}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--p-bg)',
        color: 'var(--p-text)',
      }}
    >
      <TopBar
        onExport={() => setShowExport(true)}
        onSave={handleSave}
        onEditSteps={() => setShowSteps(true)}
        onEditLightness={() => setShowLightness(true)}
        mode={mode}
        onModeChange={setMode}
        theme={theme}
        onThemeChange={setTheme}
        saveStatus={saveStatus}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {mode === 'edit' && scales.length > 0 && <Sidebar />}

        {mode === 'edit' && (scale ? <EditPanel scale={scale} /> : <BulkCreatePanel />)}
        {mode === 'preview' && <PalettePreview />}
        {mode === 'visualize' && <PaletteColorWheel />}
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showSteps && scale && <StepListModal scale={scale} mode="names" applyToAll onClose={() => setShowSteps(false)} />}
      {showLightness && scale && <StepListModal scale={scale} mode="lightness" onClose={() => setShowLightness(false)} />}
    </div>
  );
}
