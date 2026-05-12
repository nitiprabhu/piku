// Main app: router + tweaks panel
const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "cream",
  "language": "en",
  "fontDisplay": "Anton",
  "fontBody": "Plus Jakarta Sans",
  "density": "comfortable",
  "heroMode": "rotating",
  "accent": "orange"
}/*EDITMODE-END*/;

function App() {
  const tw = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useStateA(() => {
    const h = location.hash.replace('#/', '');
    return h || 'landing';
  });
  const go = (r) => {
    setRoute(r);
    history.replaceState(null, '', '#/' + r);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffectA(() => {
    const onHash = () => setRoute(location.hash.replace('#/', '') || 'landing');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // apply theme + lang globally
  useEffectA(() => {
    document.body.dataset.theme = tw.theme;
    window.__lang = tw.language;
    const root = document.documentElement;
    root.style.setProperty('--font-display', tw.fontDisplay);
    root.style.setProperty('--font-body', tw.fontBody);
    if (tw.accent === 'pink') {
      root.style.setProperty('--orange', '#F4358D');
      root.style.setProperty('--orange-dark', '#C2185B');
    } else if (tw.accent === 'green') {
      root.style.setProperty('--orange', '#1F8A5B');
      root.style.setProperty('--orange-dark', '#0D5E3D');
    } else if (tw.accent === 'purple') {
      root.style.setProperty('--orange', '#7B2CBF');
      root.style.setProperty('--orange-dark', '#5A189A');
    } else {
      root.style.setProperty('--orange', body_get('--orange'));
      // restore theme defaults
      document.body.dataset.theme = tw.theme;
    }
    const pad = { compact: 0.85, comfortable: 1, spacious: 1.18 }[tw.density] || 1;
    root.style.setProperty('--pad', pad);
  }, [tw.theme, tw.language, tw.fontDisplay, tw.fontBody, tw.accent, tw.density]);

  function body_get(varName) { return ''; }

  const screens = {
    landing: <ScreenLanding />,
    login: <ScreenLogin />,
    dashboard: <ScreenDashboard />,
    templates: <ScreenTemplates />,
    create: <ScreenCreate />,
    generation: <ScreenGeneration />,
    preview: <ScreenPreview />,
    pricing: <ScreenPricing />,
  };
  const Current = screens[route] || screens.landing;

  return (
    <RouterCtx.Provider value={{ route, go }}>
      {Current}
      <TweaksPanel title="Tweaks" defaultPos={{right: 24, bottom: 24}}>
        <TweakSection title="Theme">
          <TweakColor label="Palette" value={tw.theme} onChange={v => tw.set('theme', v)}
            options={[
              ['#FDF4E3','#FF5722','#FAE8C8'],
              ['#FFF8E1','#E65100','#FFE9B0'],
              ['#F0F5EE','#E64A19','#DDEAD8'],
              ['#14110D','#FF6E40','#221C14'],
            ]}
            optionLabels={['Cream','Saffron','Mint','Ink (dark)']}
          />
          <TweakRadio label="Language" value={tw.language} onChange={v => tw.set('language', v)}
            options={[{value: 'en', label: 'English'}, {value: 'hi', label: 'हिंदी'}]} />
          <TweakColor label="Accent override" value={tw.accent} onChange={v => tw.set('accent', v)}
            options={['#FF5722','#F4358D','#1F8A5B','#7B2CBF']}
            optionLabels={['Orange','Pink','Green','Purple']}
          />
        </TweakSection>

        <TweakSection title="Typography">
          <TweakSelect label="Display font" value={tw.fontDisplay} onChange={v => tw.set('fontDisplay', v)}
            options={[
              {value: 'Anton', label: 'Anton (condensed bold)'},
              {value: 'Archivo Black', label: 'Archivo Black (chunky)'},
              {value: 'DM Sans', label: 'DM Sans (modern)'},
              {value: 'Plus Jakarta Sans', label: 'Plus Jakarta (soft)'},
            ]} />
          <TweakSelect label="Body font" value={tw.fontBody} onChange={v => tw.set('fontBody', v)}
            options={[
              {value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans'},
              {value: 'DM Sans', label: 'DM Sans'},
              {value: 'Inter', label: 'Inter'},
            ]} />
        </TweakSection>

        <TweakSection title="Layout">
          <TweakRadio label="Density" value={tw.density} onChange={v => tw.set('density', v)}
            options={[{value: 'compact', label: 'Compact'}, {value: 'comfortable', label: 'Cozy'}, {value: 'spacious', label: 'Big'}]} />
          <TweakRadio label="Hero copy" value={tw.heroMode} onChange={v => tw.set('heroMode', v)}
            options={[{value: 'rotating', label: 'Rotate'}, {value: 'money', label: 'Money'}, {value: 'time', label: 'Time'}]} />
        </TweakSection>

        <TweakSection title="Jump to screen">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
            {['landing','login','dashboard','templates','create','generation','preview','pricing'].map(r => (
              <button key={r} onClick={() => go(r)} style={{
                padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: route === r ? '#FF5722' : '#fff',
                color: route === r ? '#fff' : '#1A1410',
                border: '1.5px solid #1A1410', cursor: 'pointer',
                textTransform: 'capitalize',
              }}>{r}</button>
            ))}
          </div>
        </TweakSection>
      </TweaksPanel>
    </RouterCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
