"use client";
// Particle animation uses native CSS transition (not Framer Motion) because
// motion cannot interpolate x from 0 to a calc() percentage string smoothly.

import React, { useState, useRef } from 'react';
import { Deck, Slide, Fragment } from '@revealjs/react';
import { motion } from 'motion/react';

import 'reveal.js/reveal.css';
import 'reveal.js/theme/dracula.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const ss = (obj: React.CSSProperties): React.CSSProperties => obj;

const FadeUp = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const GlowBadge = ({ letter, color }: { letter: string; color: string }) => (
  <motion.div
    style={ss({
      color, width: 64, height: 64, borderRadius: '50%', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontWeight: 900,
      fontSize: '2rem', flexShrink: 0,
      backgroundColor: `${color}20`, border: `2px solid ${color}88`,
    })}
    animate={{ boxShadow: [`0 0 10px ${color}44`, `0 0 30px ${color}99`, `0 0 10px ${color}44`] }}
    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
  >
    {letter}
  </motion.div>
);

const RadiationBar = ({
  label, subtext, color, index,
}: { label: string; subtext: string; color: string; index: number }) => {
  const names: Record<string, string> = {
    α: 'Promieniowanie Alfa',
    β: 'Promieniowanie Beta',
    γ: 'Promieniowanie Gamma',
  };
  return (
    <motion.div
      style={ss({
        backgroundColor: '#191926', borderLeft: `4px solid ${color}`,
        borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
      })}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.015, transition: { duration: 0.18 } }}
    >
      <GlowBadge letter={label} color={color} />
      <div>
        <h3 style={ss({ color, fontWeight: 700, fontSize: '1.15rem', margin: '0 0 4px' })}>{names[label]}</h3>
        <p style={ss({ color: '#94a3b8', fontSize: '0.95rem', margin: 0 })}>{subtext}</p>
      </div>
    </motion.div>
  );
};

const StatRow = ({ name, half, color, delay }: { name: string; half: string; color: string; delay: number }) => (
  <motion.div
    style={ss({
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '1px solid #334155', padding: '12px 8px',
    })}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <span style={ss({ fontWeight: 600, fontSize: '1.05rem', color })}>{name}</span>
    <span style={ss({ fontFamily: 'monospace', color: '#94a3b8' })}>{half}</span>
  </motion.div>
);

// ─── Slide 5: Radiation penetration interactive demo ────────────────────────

type ParticleType = 'alpha' | 'beta' | 'gamma';

const PARTICLES: Record<ParticleType, {
  label: string; symbol: string; color: string; stopPct: number; description: string;
}> = {
  alpha: {
    label: 'Alfa (α)', symbol: 'α', color: '#f87171', stopPct: 18,
    description: 'Zatrzymywana przez kartkę papieru lub naskórek skóry',
  },
  beta: {
    label: 'Beta (β)', symbol: 'β', color: '#60a5fa', stopPct: 49,
    description: 'Przenika przez papier — pochłania ją kilkumilimetrowa warstwa aluminium',
  },
  gamma: {
    label: 'Gamma (γ)', symbol: 'γ', color: '#facc15', stopPct: 77,
    description: 'Przenika przez papier i aluminium — zatrzymuje ją jedynie gruby blok ołowiu',
  },
};

const SHIELDS = [
  { label: '📄 Papier', color: '#94a3b8', border: '#475569', leftPct: 20 },
  { label: '🔩 Aluminium', color: '#2dd4bf', border: '#0d9488', leftPct: 50 },
  { label: '🧱 Ołów', color: '#6b7280', border: '#374151', leftPct: 79 },
];

const ANIM_DURATION = 1400; // ms — visible travel time
const RESULT_DELAY = ANIM_DURATION + 200; // ms — when to show result text
const UNLOCK_DELAY = ANIM_DURATION + 600; // ms — when to unlock buttons

function PenetrationDemo() {
  const [firing, setFiring] = useState(false);
  const [lastType, setLastType] = useState<ParticleType | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Particle CSS state: left% and opacity controlled imperatively
  const particleRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const emit = (type: ParticleType) => {
    if (firing) return;
    clearTimers();

    const cfg = PARTICLES[type];
    setFiring(true);
    setLastType(type);
    setShowResult(false);

    const el = particleRef.current;
    if (!el) return;

    // Reset particle to start position instantly (no transition)
    el.style.transition = 'none';
    el.style.left = '0%';
    el.style.opacity = '1';
    el.style.background = cfg.color;
    el.style.boxShadow = `0 0 16px ${cfg.color}cc, 0 0 36px ${cfg.color}66`;
    el.textContent = cfg.symbol;

    // Force browser reflow so the reset is applied before we add transition
    void el.offsetWidth;

    // Animate to target using CSS transition
    el.style.transition = `left ${ANIM_DURATION}ms cubic-bezier(0.4, 0, 0.6, 1), opacity 300ms ease`;
    el.style.left = `${cfg.stopPct}%`;

    // Fade out near the end
    timersRef.current.push(setTimeout(() => {
      if (particleRef.current) particleRef.current.style.opacity = '0';
    }, ANIM_DURATION - 250));

    // Show result text
    timersRef.current.push(setTimeout(() => setShowResult(true), RESULT_DELAY));

    // Unlock buttons
    timersRef.current.push(setTimeout(() => setFiring(false), UNLOCK_DELAY));
  };

  const lastCfg = lastType ? PARTICLES[lastType] : null;

  return (
    <div style={ss({ maxWidth: 860, margin: '0 auto' })}>

      {/* Emission buttons */}
      <div style={ss({ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 })}>
        {(Object.entries(PARTICLES) as [ParticleType, typeof PARTICLES[ParticleType]][]).map(([type, cfg]) => (
          <motion.button
            key={type}
            onClick={() => emit(type)}
            style={ss({
              background: `${cfg.color}18`,
              border: `2px solid ${firing ? cfg.color + '40' : cfg.color + 'bb'}`,
              color: firing ? cfg.color + '55' : cfg.color,
              borderRadius: 10, padding: '9px 26px',
              fontWeight: 700, fontSize: '1rem',
              cursor: firing ? 'not-allowed' : 'pointer',
              transition: 'border-color 0.25s, color 0.25s',
            })}
            whileHover={firing ? {} : { scale: 1.06, y: -1 }}
            whileTap={firing ? {} : { scale: 0.95 }}
          >
            Emituj {cfg.symbol}
          </motion.button>
        ))}
      </div>

      {/* Track */}
      <div style={ss({ position: 'relative', height: 110, display: 'flex', alignItems: 'center', marginBottom: 8 })}>
        {/* Source orb */}
        <motion.div
          style={ss({
            width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
            background: 'radial-gradient(circle, #22c55e 25%, #14532d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.7rem', color: '#fff', zIndex: 4,
          })}
          animate={{ boxShadow: ['0 0 8px #22c55e44', '0 0 30px #22c55eaa', '0 0 8px #22c55e44'] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          Źródło
        </motion.div>

        {/* Horizontal track */}
        <div style={ss({ flex: 1, position: 'relative', height: '100%', marginLeft: 8 })}>
          {/* Dashed beam line */}
          <div style={ss({
            position: 'absolute', top: '50%', left: 0, right: 0, height: 2,
            background: 'repeating-linear-gradient(90deg, #334155 0, #334155 8px, transparent 8px, transparent 16px)',
            transform: 'translateY(-50%)',
          })} />

          {/* Shields */}
          {SHIELDS.map((sh, i) => (
            <motion.div
              key={sh.label}
              style={ss({
                position: 'absolute', left: `${sh.leftPct}%`, top: '8%', bottom: '8%', width: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, border: `2px solid ${sh.border}`,
                backgroundColor: `${sh.color}18`,
                fontWeight: 700, fontSize: '0.62rem', textAlign: 'center',
                color: sh.color, padding: '2px 3px', lineHeight: 1.2, zIndex: 3,
              })}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: i * 0.12, type: 'spring', stiffness: 220, damping: 18 }}
            >
              {sh.label}
            </motion.div>
          ))}

          {/*
            Particle: single persistent DOM node, imperatively animated by emit().
            Uses CSS transition on `left` — reliable percentage interpolation.
            Starts hidden (opacity: 0), shown only during flight.
          */}
          <div
            ref={particleRef}
            style={{
              position: 'absolute',
              top: '50%',
              left: '0%',
              marginTop: -14,
              width: 28,
              height: 28,
              borderRadius: '50%',
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              color: '#000',
              fontSize: '0.85rem',
              userSelect: 'none',
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Result label */}
      <div style={ss({ minHeight: 44, textAlign: 'center' })}>
        {showResult && lastCfg ? (
          <motion.p
            key={lastType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={ss({ color: lastCfg.color, fontWeight: 700, fontSize: '1rem', margin: 0 })}
          >
            {lastCfg.label} — {lastCfg.description}
          </motion.p>
        ) : !showResult && !lastType ? (
          <p style={ss({ color: '#475569', fontSize: '0.9rem', margin: 0 })}>
            Wybierz rodzaj promieniowania, aby zbadać jego zdolność przenikania
          </p>
        ) : null}
      </div>

      {/* Shield legend */}
      <div style={ss({ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 10 })}>
        {SHIELDS.map((sh) => (
          <div key={sh.label} style={ss({ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: sh.color })}>
            <div style={ss({ width: 10, height: 10, borderRadius: 2, backgroundColor: sh.color })} />
            {sh.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Presentation ───────────────────────────────────────────────────────

export default function Presentation() {
  return (
    <div style={ss({ width: '100vw', height: '100vh', background: '#0d0d1a' })}>
      <Deck
        config={{
          hash: true,
          transition: 'fade',
          transitionSpeed: 'fast',
          slideNumber: 'c/t',
          margin: 0.06,
          width: 1280,
          height: 720,
        }}
      >

        {/* ══ Slajd 1: Tytuł ══ */}
        <Slide backgroundImage={`${basePath}/images/nuclear_title_bg.png`} backgroundOpacity={0.35} backgroundSize="cover">
          <FadeUp>
            <h1 style={ss({
              fontSize: '3.8rem', fontWeight: 900, color: '#67e8f9',
              textShadow: '0 0 40px rgba(103,232,249,0.5)',
              lineHeight: 1.15, marginBottom: '0.8rem',
            })}>
              Promieniowanie Jądrowe
            </h1>
          </FadeUp>
          <FadeUp delay={0.3}>
            <p style={ss({ fontSize: '1.4rem', color: '#cbd5e1', letterSpacing: '0.07em' })}>
              Promieniowanie jądrowe — zjawisko, właściwości i zastosowania · Fizyka — zakres podstawowy
            </p>
          </FadeUp>
          <FadeUp delay={0.65}>
            <motion.div
              style={ss({
                marginTop: '2.5rem', display: 'inline-block',
                padding: '0.45rem 2rem',
                border: '1px solid rgba(103,232,249,0.35)',
                borderRadius: 999, color: 'rgba(103,232,249,0.65)',
                fontSize: '0.88rem', letterSpacing: '0.14em',
              })}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              ▼ &nbsp; Naciśnij strzałkę lub spację, aby kontynuować
            </motion.div>
          </FadeUp>
        </Slide>

        {/* ══ Slajd 2: Definicja ══ */}
        <Slide>
          <FadeUp>
            <h2 style={ss({ fontSize: '2.5rem', fontWeight: 700, color: '#60a5fa', marginBottom: '1rem' })}>
              Czym jest promieniowanie?
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p style={ss({ fontSize: '1.15rem', lineHeight: 1.75, color: '#e2e8f0', maxWidth: 820, margin: '0 auto 1.4rem' })}>
              Jądra atomowe dążą do <strong>stabilności</strong>. Gdy jądro zawiera zbyt wiele energii
              lub niekorzystny stosunek protonów do neutronów — staje się&nbsp;
              <span style={ss({ color: '#f87171', fontWeight: 700 })}>niestabilnym izotopem promieniotwórczym</span>.
            </p>
          </FadeUp>
          <Fragment>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              style={ss({
                background: 'rgba(30,64,175,0.22)', border: '1px solid rgba(96,165,250,0.4)',
                borderRadius: 16, padding: '1.4rem 2rem', maxWidth: 820, margin: '0 auto',
              })}
            >
              <p style={ss({ fontSize: '1.2rem', color: '#bae6fd', lineHeight: 1.65, margin: 0 })}>
                Aby odzyskać stabilność, jądro <strong>emituje </strong> nadmiar energii w postaci
                cząstek lub fal elektromagnetycznych — tę uwolnioną energię nazywamy&nbsp;
                <em style={ss({ color: '#38bdf8' })}>promieniowaniem jądrowym</em>.
              </p>
            </motion.div>
          </Fragment>
        </Slide>

        {/* ══ Slajd 3: Ciekawostka – Banan ══ */}
        <Slide backgroundImage={`${basePath}/images/radioactive_banana.png`} backgroundOpacity={0.25} backgroundSize="cover">
          <FadeUp>
            <h2 style={ss({ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24', textAlign: 'left', textShadow: '0 2px 24px #000' })}>
              Naturalna radioaktywność człowieka
            </h2>
          </FadeUp>
          <FadeUp delay={0.25}>
            <div style={ss({
              background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(10px)',
              borderRadius: 16, padding: '1.4rem 1.6rem', marginTop: '0.8rem',
              textAlign: 'left', maxWidth: 700,
            })}>
              <p style={ss({ fontSize: '1.1rem', color: '#f1f5f9', lineHeight: 1.72, marginBottom: '1rem' })}>
                W ludzkim ciele i w pożywieniu (szczególnie w bananach i orzechach) naturalnie
                występuje promieniotwórczy&nbsp;
                <strong style={ss({ color: '#fde68a' })}>Potas-40</strong> oraz <strong style={ss({ color: '#fde68a' })}>Węgiel-14</strong>.
              </p>
              <Fragment>
                <motion.div
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  style={ss({
                    background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.5)',
                    borderRadius: 12, padding: '0.9rem 1rem',
                  })}
                >
                  <h4 style={ss({ color: '#fde68a', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 6px' })}>
                    Bananowy Ekwiwalent Dawki (BED)
                  </h4>
                  <p style={ss({ color: '#e2e8f0', fontSize: '1rem', margin: 0, lineHeight: 1.6 })}>
                    Jeden banan odpowiada ekspozycji ~0,1 µSv. Odczuwalne skutki biologiczne wymagałyby
                    spożycia <strong>kilkudziesięciu milionów bananów jednocześnie</strong>.
                  </p>
                </motion.div>
              </Fragment>
            </div>
          </FadeUp>
        </Slide>

        {/* ══ Slajd 4: Rodzaje Promieniowania ══ */}
        <Slide>
          <FadeUp>
            <h2 style={ss({ fontSize: '2.5rem', fontWeight: 700, color: '#4ade80', marginBottom: '1.4rem' })}>
              Rodzaje Promieniowania Jądrowego
            </h2>
          </FadeUp>
          <div style={ss({ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 820, margin: '0 auto' })}>
            <Fragment>
              <RadiationBar
                label="α" color="#f87171" index={0}
                subtext="Ciężkie jądra Helu (2 protony + 2 neutrony). Silnie jonizujące — zasięg zaledwie kilku centymetrów w powietrzu."
              />
            </Fragment>
            <Fragment>
              <RadiationBar
                label="β" color="#60a5fa" index={1}
                subtext="Elektrony lub pozytony emitowane przy przemianie neutron↔proton. Zasięg do kilku metrów w powietrzu."
              />
            </Fragment>
            <Fragment>
              <RadiationBar
                label="γ" color="#facc15" index={2}
                subtext="Promieniowanie elektromagnetyczne o bardzo krótkiej długości fali. Nie ma masy ani ładunku — przenika przez większość materiałów."
              />
            </Fragment>
          </div>
        </Slide>

        {/* ══ Slajd 5: Przenikliwość – interaktywna demo ══ */}
        <Slide>
          <FadeUp>
            <h2 style={ss({ fontSize: '2.3rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.4rem' })}>
              Zdolność przenikania promieniowania
            </h2>
            <p style={ss({ fontSize: '0.92rem', color: '#64748b', margin: '0 0 16px' })}>
              Naciśnij przycisk, aby zaobserwować, jak poszczególne rodzaje promieniowania pokonują kolejne bariery
            </p>
          </FadeUp>
          <PenetrationDemo />
        </Slide>

        {/* ══ Slajd 6: Czas połowicznego rozpadu ══ */}
        <Slide>
          <FadeUp>
            <h2 style={ss({ fontSize: '2.5rem', fontWeight: 700, color: '#f472b6', marginBottom: '0.8rem' })}>
              Czas połowicznego rozpadu (T½)
            </h2>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p style={ss({ fontSize: '1.1rem', color: '#e2e8f0', maxWidth: 780, margin: '0 auto 1.4rem', lineHeight: 1.72 })}>
              Izotopy promieniotwórcze rozpadają się w sposób ciągły i statystycznie przewidywalny. <strong>T½</strong> to czas,
              po którym połowa jąder w próbce ulegnie przemianie, a aktywność substancji zmniejszy się o 50%.
            </p>
          </FadeUp>
          <FadeUp delay={0.3}>
            <div style={ss({
              background: 'rgba(30,10,40,0.65)', border: '1px solid rgba(244,114,182,0.28)',
              borderRadius: 16, padding: '0.8rem 2rem', maxWidth: 700, margin: '0 auto',
            })}>
              <StatRow name="Francez-223" half="T½ ≈ 22 minuty" color="#67e8f9" delay={0.4} />
              <StatRow name="Kobalt-60" half="T½ ≈ 5,27 roku" color="#a78bfa" delay={0.55} />
              <StatRow name="Węgiel-14" half="T½ ≈ 5 730 lat" color="#4ade80" delay={0.7} />
              <StatRow name="Uran-238" half="T½ ≈ 4,5 mld lat" color="#fbbf24" delay={0.85} />
            </div>
          </FadeUp>
        </Slide>

        {/* ══ Slajd 7: Radowe Dziewczyny ══ */}
        <Slide>
          <FadeUp>
            <h2 style={ss({ fontSize: '2.35rem', fontWeight: 900, color: '#fb7185', marginBottom: '0.2rem' })}>
              Historia: skutki nieznajomości zagrożeń
            </h2>
            <h3 style={ss({ fontSize: '1.3rem', fontWeight: 300, color: '#fda4af', fontStyle: 'italic', marginBottom: '1rem' })}>
              „Radowe Dziewczyny" — lata 20. XX w.
            </h3>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p style={ss({ fontSize: '1.08rem', color: '#e2e8f0', maxWidth: 780, margin: '0 auto 0.8rem', lineHeight: 1.7 })}>
              Na początku XX w. rad był powszechnie postrzegany jako substancja lecznicza. Firmy farmaceutyczne
              wprowadzały do obrotu produkty z jego zawartością, reklamując je jako środki prozdrowotne.
            </p>
          </FadeUp>
          <Fragment>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              style={ss({
                background: 'rgba(159,18,57,0.22)', border: '1px solid rgba(251,113,133,0.45)',
                borderLeft: '4px solid #fb7185', borderRadius: 12,
                padding: '1.2rem 1.5rem', maxWidth: 780, margin: '0 auto',
                textAlign: 'left', fontSize: '1rem', color: '#fecdd3', lineHeight: 1.72,
              })}
            >
              Pracownice fabryk zegarków malowały tarcze fluorescencyjną farbą zawierającą rad.
              Na polecenie pracodawcy wygładzały pędzelki wargami, aby zachować precyzję —
              pochłaniając substancję bezpośrednio do organizmu.&nbsp;
              <strong>Dziesiątki kobiet zachorowały i zginęły.</strong> Ich przełomowa sprawa sądowa
              stała się fundamentem nowoczesnego prawodawstwa z zakresu bezpieczeństwa i higieny pracy.
            </motion.div>
          </Fragment>
        </Slide>

        {/* ══ Slajd 8: Radioaktywność wokół nas ══ */}
        <Slide>
          <FadeUp>
            <h2 style={ss({ fontSize: '2.5rem', fontWeight: 700, color: '#2dd4bf', marginBottom: '1.2rem' })}>
              Promieniowanie w codziennym życiu
            </h2>
          </FadeUp>
          <div style={ss({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 900, margin: '0 auto' })}>
            {([
              {
                icon: '🌫️', title: 'Radon', color: '#2dd4bf', delay: 0.1,
                text: 'Największa roczna dawka promieniowania naturalnego pochodzi od gazu Radon, który przedostaje się z gruntu przez fundamenty budynków. Szczególnie niebezpieczny w piwnicach — regularne wietrzenie zmniejsza stężenie.',
              },
              {
                icon: '🔔', title: 'Czujnik dymu', color: '#34d399', delay: 0.22,
                text: 'Jonizacyjne czujniki dymu zawierają śladową ilość Ameryku-241 emitującego cząstki alfa. Dym zaburza jonizację powietrza w komorze — układ alarmowy reaguje natychmiast.',
              },
              {
                icon: '🌍', title: 'Promieniowanie kosmiczne', color: '#60a5fa', delay: 0.34,
                text: 'Na wysokości przelotu samolotów dawka promieniowania kosmicznego jest kilkakrotnie wyższa niż na poziomie morza. Personel lotniczy jest traktowany jako zawodowo narażony.',
              },
              {
                icon: '🏺', title: 'Szkło uranowe', color: '#a78bfa', delay: 0.46,
                text: 'Zielone szkło dekoracyjne produkowane w latach 20.–30. XX w. zawierało tlenek uranu. Pod lampą UV emituje charakterystyczną zieloną fluorescencję i posiada niską radioaktywność.',
              },
            ] as { icon: string; title: string; color: string; delay: number; text: string }[]).map(({ icon, title, color, delay, text }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay }}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                style={ss({
                  background: 'rgba(15,23,42,0.72)', border: `1px solid ${color}38`,
                  borderRadius: 14, padding: '1.1rem 1.2rem', textAlign: 'left',
                })}
              >
                <h3 style={ss({ color, fontWeight: 700, fontSize: '1.1rem', margin: '0 0 6px' })}>{icon} {title}</h3>
                <p style={ss({ color: '#94a3b8', fontSize: '0.88rem', margin: 0, lineHeight: 1.62 })}>{text}</p>
              </motion.div>
            ))}
          </div>
        </Slide>

        {/* ══ Slajd 9: Zastosowania + Czerenkow ══ */}
        <Slide backgroundImage={`${basePath}/images/cherenkov_radiation.png`} backgroundOpacity={0.28} backgroundSize="cover">
          <FadeUp>
            <h2 style={ss({
              fontSize: '2.5rem', fontWeight: 900, color: '#67e8f9',
              textShadow: '0 0 20px rgba(103,232,249,0.45)', marginBottom: '1rem',
            })}>
              Zastosowania promieniowania jądrowego
            </h2>
          </FadeUp>
          <div style={ss({
            background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(10px)',
            borderRadius: 16, padding: '1.4rem 2rem', maxWidth: 860,
            margin: '0 auto', textAlign: 'left',
          })}>
            {([
              {
                icon: '🏥', title: 'Radioterapia onkologiczna',
                text: 'Skupiony strumień promieniowania jonizującego niszczy komórki nowotworowe z chirurgiczną precyzją, oszczędzając zdrowe tkanki.',
              },
              {
                icon: '⚡', title: 'Efekt Czerenkowa w reaktorze jądrowym',
                text: 'Charakterystyczna niebieska luminescencja w basenach reaktorów to efekt Czerenkowa. Powstaje, gdy naładowane cząstki poruszają się w wodzie z prędkością przekraczającą prędkość fazową światła w tym ośrodku.',
              },
              {
                icon: '🔬', title: 'Datowanie radiowęglowe (metoda ¹⁴C)',
                text: 'Analiza zawartości Węgla-14 w próbkach organicznych pozwala określić ich wiek z dokładnością do kilkudziesięciu lat — nieocenione narzędzie archeologii.',
              },
              {
                icon: '💡', title: 'Sterylizacja i konserwacja żywności',
                text: 'Promieniowanie gamma niszczy drobnoustroje bez podnoszenia temperatury produktu, przedłużając jego trwałość i zachowując właściwości odżywcze.',
              },
            ] as { icon: string; title: string; text: string }[]).map(({ icon, title, text }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: i * 0.18 }}
                style={ss({ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 })}
              >
                <span style={ss({ fontSize: '1.2rem', flexShrink: 0, marginTop: 2 })}>{icon}</span>
                <p style={ss({ margin: 0, color: '#e2e8f0', fontSize: '0.97rem', lineHeight: 1.62 })}>
                  <strong style={ss({ color: '#67e8f9' })}>{title}: </strong>{text}
                </p>
              </motion.div>
            ))}
          </div>
        </Slide>

        {/* ══ Slajd 10: ALARA ══ */}
        <Slide>
          <FadeUp>
            <h2 style={ss({ fontSize: '2.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.3rem' })}>
              Zasada bezpieczeństwa radiologicznego
            </h2>
          </FadeUp>
          <FadeUp delay={0.18}>
            <motion.h3
              style={ss({
                fontSize: '2.9rem', fontWeight: 900, color: '#fbbf24',
                letterSpacing: '0.22em', margin: '0 0 0.2rem',
              })}
              animate={{ textShadow: ['0 0 15px rgba(251,191,36,0.2)', '0 0 40px rgba(251,191,36,0.65)', '0 0 15px rgba(251,191,36,0.2)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ALARA
            </motion.h3>
            <p style={ss({ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.2rem', fontStyle: 'italic' })}>
              As Low As Reasonably Achievable — dawka promieniowania tak niska, jak jest to rozsądnie osiągalne
            </p>
          </FadeUp>

          <div style={ss({ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, maxWidth: 840, margin: '0 auto 1.2rem' })}>
            {([
              {
                icon: '⏱️', title: 'Czas ekspozycji', color: '#c084fc', delay: 0.3,
                text: 'Pochłoniętą dawkę promieniowania ogranicza się przez minimalizację czasu przebywania w polu promieniowania.',
              },
              {
                icon: '📏', title: 'Odległość', color: '#60a5fa', delay: 0.44,
                text: 'Dawka maleje proporcjonalnie do kwadratu odległości od źródła — dwukrotne oddalenie redukuje dawkę czterokrotnie.',
              },
              {
                icon: '🛡️', title: 'Ekranowanie', color: '#94a3b8', delay: 0.58,
                text: 'Materiały pochłaniające (ołów, beton, woda) umieszczone między źródłem a człowiekiem skutecznie redukują ekspozycję.',
              },
            ] as { icon: string; title: string; color: string; delay: number; text: string }[]).map(({ icon, title, text, color, delay }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay }}
                whileHover={{ scale: 1.04 }}
                style={ss({
                  background: `${color}14`, border: `1px solid ${color}50`,
                  borderTop: `3px solid ${color}`, borderRadius: 12, padding: '1rem',
                })}
              >
                <p style={ss({ fontSize: '1.7rem', margin: '0 0 4px' })}>{icon}</p>
                <p style={ss({ fontWeight: 700, color, fontSize: '1.05rem', margin: '0 0 4px' })}>{title}</p>
                <p style={ss({ color: '#cbd5e1', fontSize: '0.83rem', margin: 0, lineHeight: 1.5 })}>{text}</p>
              </motion.div>
            ))}
          </div>

          <FadeUp delay={0.75}>
            <motion.p
              style={ss({ fontSize: '1.4rem', fontWeight: 700, color: '#67e8f9' })}
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              Dziękuję za uwagę.
            </motion.p>
          </FadeUp>
        </Slide>

      </Deck>
    </div>
  );
}
