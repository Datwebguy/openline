import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const C = {
  paper: '#ffffff',
  graphite: '#2c2d30',
  carbon: '#211d1d',
  slate: '#747579',
  silver: '#c7c8c8',
  mint: '#00caa0',
  mintWash: '#d4f5e8',
  peach: '#ffe4d6',
  lavender: '#e8e0ff',
  periwinkle: '#dde7f7',
  mintDeep: '#087d69',
  red: '#d95b4f',
};

const font = 'Inter, Arial, sans-serif';
const display = 'Arial, Helvetica, sans-serif';
const fontFamily = font;

const sceneDurations = [240, 300, 360, 510, 510, 420, 600, 360];
const sceneStarts = sceneDurations.reduce((acc, duration, index) => {
  acc.push(index === 0 ? 0 : acc[index - 1] + sceneDurations[index - 1]);
  return acc;
}, []);

const fadeIn = (frame, start = 0, duration = 18) => interpolate(frame, [start, start + duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const slideUp = (frame, start = 0, distance = 30) => interpolate(frame, [start, start + 24], [distance, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const ease = (frame, start, end, from, to) => interpolate(frame, [start, end], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

function Mark({ size = 72, dark = true }) {
  return (
    <div style={{
      width: size,
      height: size * 0.64,
      borderRadius: size,
      background: dark ? C.graphite : C.paper,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: size * 0.1,
      transform: 'rotate(-2deg)',
    }}>
      {[0, 1, 2].map((n) => <span key={n} style={{ width: size * 0.11, height: size * 0.11, borderRadius: '50%', background: dark ? C.paper : C.graphite }} />)}
    </div>
  );
}

function BrandBar({ light = false }) {
  return (
    <div style={{ position: 'absolute', top: 38, left: 64, right: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: light ? C.paper : C.graphite, zIndex: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: display, fontWeight: 700, fontSize: 24, letterSpacing: '-0.06em' }}>
        <Mark size={38} dark={!light} /> openline<span style={{ color: light ? C.mint : C.mintDeep }}>.</span>
      </div>
      <div style={{ fontFamily, fontSize: 15, color: light ? 'rgba(255,255,255,.72)' : C.slate, letterSpacing: '0.02em' }}>THE PHONE WORKSPACE&nbsp;&nbsp; / &nbsp;&nbsp;DEMO</div>
    </div>
  );
}

function Progress({ scene, light = false }) {
  return (
    <div style={{ position: 'absolute', left: 64, right: 64, bottom: 34, zIndex: 30, display: 'flex', gap: 8 }}>
      {sceneDurations.map((_, index) => <div key={index} style={{ height: 3, flex: 1, borderRadius: 3, background: index <= scene ? C.mint : (light ? 'rgba(255,255,255,.24)' : '#e8e9e9') }} />)}
    </div>
  );
}

function Kicker({ children, color = C.mintDeep }) {
  return <div style={{ fontFamily, color, fontWeight: 700, fontSize: 15, letterSpacing: '0.17em', textTransform: 'uppercase' }}>{children}</div>;
}

function Headline({ children, size = 76, color = C.graphite, style = {} }) {
  return <div style={{ fontFamily: display, color, fontWeight: 600, fontSize: size, lineHeight: 1.02, letterSpacing: '-0.055em', ...style }}>{children}</div>;
}

function Caption({ children, light = false, width = 720 }) {
  return <div style={{ fontFamily, color: light ? 'rgba(255,255,255,.78)' : C.slate, fontSize: 26, lineHeight: 1.35, maxWidth: width, letterSpacing: '-0.025em' }}>{children}</div>;
}

function Shell({ children, scene, background = C.paper, light = false }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle at 10% 10%, ${light ? 'rgba(0,202,160,.12)' : 'rgba(0,202,160,.055)'} 0, transparent 26%), radial-gradient(circle at 90% 80%, ${light ? 'rgba(232,224,255,.16)' : 'rgba(232,224,255,.28)'} 0, transparent 26%)` }} />
      <BrandBar light={light} />
      {children}
      <Progress scene={scene} light={light} />
      <div style={{ position: 'absolute', right: 64, bottom: 57, color: light ? 'rgba(255,255,255,.58)' : '#a9aaaa', fontFamily, fontSize: 14, letterSpacing: '0.08em' }}>{String(scene + 1).padStart(2, '0')} / 08</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: light ? 'rgba(255,255,255,.18)' : '#eceeee' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: light ? 'rgba(255,255,255,.18)' : '#eceeee' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'linear-gradient(90deg, transparent 49.9%, #2c2d30 50%, transparent 50.1%), linear-gradient(0deg, transparent 49.9%, #2c2d30 50%, transparent 50.1%)', backgroundSize: '120px 120px', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
}

function SceneHook() {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 0, 20);
  const y = slideUp(frame, 0, 38);
  return <Shell scene={0}>
    <div style={{ position: 'absolute', left: 150, top: 220, opacity, transform: `translateY(${y}px)` }}>
      <Kicker>THE PROBLEM ISN'T INFORMATION</Kicker>
      <Headline size={100} style={{ marginTop: 30, maxWidth: 1200 }}>It is knowing<br /><span style={{ color: C.mintDeep }}>what is true today.</span></Headline>
      <Caption width={700}>A directory can say “open.” The phone can say “we’re full.” For someone who needs help now, that difference matters.</Caption>
    </div>
    <div style={{ position: 'absolute', right: 180, top: 265, width: 480, height: 340, opacity: fadeIn(frame, 18, 30), transform: `rotate(-4deg) translateY(${ease(frame, 18, 45, 24, 0)}px)`, background: C.peach, borderRadius: 18, padding: 30, fontFamily, color: C.graphite, boxShadow: '0 20px 60px rgba(44,45,48,.08)' }}>
      <div style={{ fontSize: 15, letterSpacing: '.14em', color: C.red, fontWeight: 700 }}>SERVICE LISTING</div>
      <div style={{ fontFamily: display, fontSize: 38, marginTop: 28, fontWeight: 600 }}>Harbor Food Hub</div>
      <div style={{ fontSize: 22, color: C.mintDeep, marginTop: 30 }}>● Open today · 9:00–17:00</div>
      <div style={{ position: 'absolute', right: 35, bottom: 34, fontSize: 18, color: C.slate }}>Last updated: 42 days ago</div>
      <div style={{ position: 'absolute', right: 28, top: 30, width: 100, height: 100, borderRadius: '50%', border: `2px solid ${C.red}`, opacity: .55 }} />
    </div>
  </Shell>;
}

function SceneProblem() {
  const frame = useCurrentFrame();
  const cards = [
    ['OPEN', 'Not the same as available', C.periwinkle],
    ['LISTED', 'Not the same as accepting', C.lavender],
    ['CURRENT', 'The fact that matters', C.mintWash],
  ];
  return <Shell scene={1}>
    <div style={{ position: 'absolute', left: 150, top: 180, opacity: fadeIn(frame, 0, 18), transform: `translateY(${slideUp(frame, 0, 24)}px)` }}>
      <Kicker>THE COST OF A STALE ANSWER</Kicker>
      <Headline size={72} style={{ marginTop: 24, maxWidth: 980 }}>A missed call can<br />be a missed chance.</Headline>
      <Caption width={820}>Openline starts from the person’s need, then verifies the facts that a webpage cannot guarantee.</Caption>
    </div>
    <div style={{ position: 'absolute', left: 150, right: 150, top: 650, display: 'flex', gap: 24 }}>
      {cards.map(([label, text, color], index) => {
        const local = frame - index * 12;
        return <div key={label} style={{ flex: 1, minHeight: 150, borderRadius: 16, background: color, padding: 28, opacity: fadeIn(local, 18, 18), transform: `translateY(${slideUp(local, 18, 30)}px)` }}><div style={{ fontFamily, fontWeight: 700, fontSize: 16, color: C.graphite, letterSpacing: '.14em' }}>{label}</div><div style={{ marginTop: 20, fontFamily: display, fontWeight: 600, fontSize: 28, color: C.graphite }}>{text}</div></div>;
      })}
    </div>
  </Shell>;
}

function StepBadge({ number, label, active = false }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily, color: active ? C.mintDeep : C.slate, fontSize: 17, fontWeight: 700, letterSpacing: '.1em' }}><span style={{ width: 42, height: 42, borderRadius: '50%', background: active ? C.mint : C.graphite, color: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{number}</span>{label}</div>;
}

function ProductFrame({ children, width = 1110, height = 630, style = {} }) {
  return <div style={{ width, height, background: C.paper, border: '1px solid #d9dcdb', borderRadius: 22, overflow: 'hidden', boxShadow: '0 24px 80px rgba(44,45,48,.12)', ...style }}>
    <div style={{ height: 54, borderBottom: '1px solid #eceeee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', fontFamily, fontSize: 14, color: C.slate }}><div style={{ display: 'flex', gap: 8 }}><i style={{ width: 10, height: 10, background: '#ff7c6b', borderRadius: '50%' }} /><i style={{ width: 10, height: 10, background: '#f3c45b', borderRadius: '50%' }} /><i style={{ width: 10, height: 10, background: '#70cf9f', borderRadius: '50%' }} /></div><span style={{ fontWeight: 700, color: C.graphite }}>openline / workspace</span><span>simulation mode</span></div>
    {children}
  </div>;
}

function Field({ label, value, wide = false, accent = false }) {
  return <div style={{ width: wide ? '100%' : '48%' }}><div style={{ fontFamily, fontSize: 12, color: C.slate, marginBottom: 8 }}>{label}</div><div style={{ border: `1px solid ${accent ? C.mint : '#d9dcdb'}`, background: accent ? '#effdf8' : C.paper, borderRadius: 9, height: 44, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily, fontSize: 15, color: C.graphite }}>{value}<span style={{ color: C.slate }}>⌄</span></div></div>;
}

function SceneReveal() {
  const frame = useCurrentFrame();
  return <Shell scene={2}>
    <div style={{ position: 'absolute', top: 160, left: 150, right: 150, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ opacity: fadeIn(frame, 0, 18), transform: `translateY(${slideUp(frame, 0, 30)}px)` }}><Kicker>A DIFFERENT KIND OF DIRECTORY</Kicker><Headline size={92} style={{ marginTop: 24 }}>Openline</Headline><Caption width={720}>A phone verification workspace for the facts that change faster than the web.</Caption></div>
      <div style={{ width: 210, height: 210, borderRadius: '50%', background: C.mintWash, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: fadeIn(frame, 15, 20), transform: `scale(${ease(frame, 15, 45, .6, 1)})` }}><Mark size={105} /></div>
    </div>
    <div style={{ position: 'absolute', left: 150, right: 150, bottom: 160, display: 'flex', justifyContent: 'space-between', paddingTop: 35, borderTop: '1px dashed #babdbc', opacity: fadeIn(frame, 60, 20) }}>
      <StepBadge number="01" label="REQUEST" active /><StepBadge number="02" label="REVIEW" /><StepBadge number="03" label="APPROVE" /><StepBadge number="04" label="DECIDE" />
    </div>
  </Shell>;
}

function SceneRequest() {
  const frame = useCurrentFrame();
  return <Shell scene={3}>
    <div style={{ position: 'absolute', left: 110, top: 150, width: 490, opacity: fadeIn(frame, 0, 18), transform: `translateY(${slideUp(frame, 0, 30)}px)` }}><Kicker>01 · CREATE A REQUEST</Kicker><Headline size={66} style={{ marginTop: 20 }}>Start with the question, not the answer.</Headline><Caption width={440}>Tell Openline what needs to be true. The context shapes the call plan.</Caption><div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 14, fontFamily, color: C.mintDeep, fontSize: 18, fontWeight: 600 }}><span style={{ fontSize: 28 }}>→</span> Need becomes a plan</div></div>
    <ProductFrame style={{ position: 'absolute', right: 105, top: 190, opacity: fadeIn(frame, 15, 24), transform: `translateX(${ease(frame, 15, 45, 80, 0)}px)` }}>
      <div style={{ padding: '30px 38px' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}><div><div style={{ fontFamily, fontSize: 13, color: C.mintDeep, letterSpacing: '.14em', fontWeight: 700 }}>CREATE A REQUEST</div><div style={{ fontFamily: display, fontWeight: 600, fontSize: 26, marginTop: 10 }}>What does someone need today?</div></div><div style={{ fontFamily: display, fontSize: 42, color: C.red }}>A</div></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}><Field label="Need" value="Food support" wide accent /><Field label="Country" value="United States" /><Field label="When is help needed?" value="Today" /><Field label="Language" value="English" /><Field label="Household size" value="2" /><Field label="Accessibility constraint" value="No additional constraint" wide /></div><div style={{ marginTop: 28, height: 48, borderRadius: 28, background: C.mint, color: C.paper, display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily, fontWeight: 700, fontSize: 16 }}>Find available options&nbsp;&nbsp; →</div></div>
    </ProductFrame>
  </Shell>;
}

function PlanCard({ title, color, questions, delay = 0 }) {
  const frame = useCurrentFrame();
  return <div style={{ flex: 1, background: color, borderRadius: 15, padding: 25, opacity: fadeIn(frame - delay, 0, 16), transform: `translateY(${slideUp(frame - delay, 0, 35)}px)` }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontFamily: display, fontSize: 23, fontWeight: 600 }}>{title}</div><span style={{ fontFamily, fontSize: 11, color: C.mintDeep, background: C.paper, borderRadius: 20, padding: '7px 12px', fontWeight: 700 }}>PREVIEW</span></div><div style={{ fontFamily, color: C.slate, fontSize: 14, marginTop: 9 }}>Verify whether this option can help today.</div><ul style={{ margin: '20px 0 0', paddingLeft: 21, color: C.graphite, fontFamily, fontSize: 14, lineHeight: 1.75 }}>{questions.map(q => <li key={q}>{q}</li>)}</ul></div>;
}

function ScenePreview() {
  const frame = useCurrentFrame();
  return <Shell scene={4}>
    <div style={{ position: 'absolute', left: 150, top: 145, opacity: fadeIn(frame, 0, 18) }}><Kicker>02 · REVIEW CALL PLAN</Kicker><Headline size={70} style={{ marginTop: 20 }}>Nothing is hidden<br />before the call.</Headline><Caption width={650}>Every question is visible. Every call is inspectable. Every action has a reason.</Caption></div>
    <div style={{ position: 'absolute', left: 150, right: 150, top: 570, display: 'flex', gap: 22 }}><PlanCard title="Harbor Food Hub" color={C.peach} delay={20} questions={['Are you accepting new households?', 'Are you open during the requested time?', 'What requirements apply?']} /><PlanCard title="Mission Community Pantry" color={C.periwinkle} delay={42} questions={['Can you support English?', 'Are walk-ins accepted today?', 'What should this household bring?']} /><PlanCard title="Sunset Neighborhood Kitchen" color={C.mintWash} delay={64} questions={['Is food support available today?', 'Do you serve a household of two?', 'What is the next step?']} /></div>
  </Shell>;
}

function SceneApprove() {
  const frame = useCurrentFrame();
  const progress = ease(frame, 0, 90, 0, 1);
  return <Shell scene={5} background={C.graphite} light>
    <div style={{ position: 'absolute', left: 150, top: 180, width: 720, opacity: fadeIn(frame, 0, 18), transform: `translateY(${slideUp(frame, 0, 30)}px)` }}><Kicker color={C.mint}>03 · APPROVE</Kicker><Headline size={80} color={C.paper} style={{ marginTop: 22 }}>A human stays<br />in the loop.</Headline><Caption light width={680}>Openline prepares the work. You decide whether the work happens.</Caption></div>
    <div style={{ position: 'absolute', right: 160, top: 170, width: 500, height: 550, background: C.paper, borderRadius: 22, padding: 34, color: C.graphite, opacity: fadeIn(frame, 18, 22), transform: `translateX(${ease(frame, 18, 48, 80, 0)}px)` }}><div style={{ fontFamily, fontSize: 13, color: C.mintDeep, fontWeight: 700, letterSpacing: '.14em' }}>EXECUTION BOUNDARY</div><div style={{ fontFamily: display, fontSize: 30, fontWeight: 600, marginTop: 18 }}>Approve these calls?</div><div style={{ fontFamily, fontSize: 17, lineHeight: 1.5, color: C.slate, marginTop: 18 }}>Openline will contact the selected options and ask only the reviewed questions.</div><div style={{ marginTop: 35, height: 12, background: '#eef0ef', borderRadius: 9, overflow: 'hidden' }}><div style={{ width: `${Math.min(progress * 100, 100)}%`, height: '100%', background: C.mint }} /></div><div style={{ display: 'flex', justifyContent: 'space-between', fontFamily, fontSize: 13, marginTop: 10, color: C.slate }}><span>Plan reviewed</span><span>{progress > .82 ? 'Approved' : 'Waiting for approval'}</span></div><div style={{ marginTop: 90, padding: 18, background: C.mintWash, borderRadius: 14, fontFamily, color: C.mintDeep, fontSize: 16, lineHeight: 1.45 }}><strong>Safe by design</strong><br />No booking. No payment. No promise. Verify facts only.</div><div style={{ marginTop: 28, height: 50, borderRadius: 28, background: progress > .82 ? C.mint : '#e4e7e6', color: progress > .82 ? C.paper : C.slate, display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily, fontWeight: 700 }}>{progress > .82 ? 'Approved to run  →' : 'Reviewing call plan…'}</div></div>
  </Shell>;
}

function ResultCard({ title, outcome, detail, tone, delay }) {
  const frame = useCurrentFrame();
  const colors = { confirmed: C.mintWash, unavailable: C.peach, uncertain: C.lavender };
  const labels = { confirmed: 'CONFIRMED', unavailable: 'UNAVAILABLE', uncertain: 'FOLLOW UP' };
  return <div style={{ borderRadius: 15, background: colors[tone], padding: 25, opacity: fadeIn(frame - delay, 0, 16), transform: `translateY(${slideUp(frame - delay, 0, 30)}px)` }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontFamily: display, fontSize: 24, fontWeight: 600 }}>{title}</div><span style={{ background: C.paper, color: tone === 'confirmed' ? C.mintDeep : tone === 'unavailable' ? C.red : '#725da4', fontFamily, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '7px 12px' }}>{labels[tone]}</span></div><div style={{ marginTop: 24, fontFamily, fontSize: 16, color: C.graphite, lineHeight: 1.45 }}>{detail}</div></div>;
}

function SceneEvidence() {
  const frame = useCurrentFrame();
  return <Shell scene={6}>
    <div style={{ position: 'absolute', left: 150, top: 130, opacity: fadeIn(frame, 0, 18) }}><Kicker>04 · DECIDE</Kicker><Headline size={72} style={{ marginTop: 20 }}>Evidence before<br /><span style={{ color: C.mintDeep }}>confidence.</span></Headline><Caption width={700}>The outcome is structured, inspectable, and honest about what is still unknown.</Caption></div>
    <div style={{ position: 'absolute', left: 150, right: 150, top: 565, display: 'flex', gap: 22 }}><ResultCard title="Harbor Food Hub" outcome="Available today" tone="confirmed" delay={10} detail="Accepting new households. Open until 5:00 PM. English supported." /><ResultCard title="Mission Community Pantry" outcome="Full today" tone="unavailable" delay={32} detail="No new households during the requested window. Recheck tomorrow." /><ResultCard title="Sunset Neighborhood Kitchen" outcome="Needs follow-up" tone="uncertain" delay={54} detail="Voicemail reached. Evidence is incomplete, so Openline says so." /></div>
  </Shell>;
}

function SceneClose() {
  const frame = useCurrentFrame();
  const scale = spring({ frame, fps: 30, config: { damping: 200, stiffness: 90 } });
  return <Shell scene={7} background={C.mint} light>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: fadeIn(frame, 0, 22) }}><div style={{ transform: `scale(${.8 + scale * .2})` }}><Mark size={110} dark={false} /></div><Kicker color={C.paper}>OPENLINE</Kicker><Headline size={105} color={C.paper} style={{ marginTop: 24 }}>Make the call<br /><em style={{ fontFamily: 'Georgia, serif', fontWeight: 400 }}>that matters.</em></Headline><div style={{ marginTop: 30, fontFamily, color: 'rgba(255,255,255,.88)', fontSize: 27, maxWidth: 740, lineHeight: 1.35 }}>Start with the question. Review the plan. Decide with evidence.</div><div style={{ marginTop: 52, padding: '17px 30px', border: '1px solid rgba(255,255,255,.6)', borderRadius: 40, color: C.paper, fontFamily, fontSize: 18, fontWeight: 700 }}>openline-five.vercel.app&nbsp;&nbsp; ↗</div></div>
  </Shell>;
}

export function OpenlineDemo() {
  return <AbsoluteFill>
    <Audio src={staticFile('video/openline-voiceover.wav')} volume={0.95} />
    <Sequence from={sceneStarts[0]} durationInFrames={sceneDurations[0]}><SceneHook /></Sequence>
    <Sequence from={sceneStarts[1]} durationInFrames={sceneDurations[1]}><SceneProblem /></Sequence>
    <Sequence from={sceneStarts[2]} durationInFrames={sceneDurations[2]}><SceneReveal /></Sequence>
    <Sequence from={sceneStarts[3]} durationInFrames={sceneDurations[3]}><SceneRequest /></Sequence>
    <Sequence from={sceneStarts[4]} durationInFrames={sceneDurations[4]}><ScenePreview /></Sequence>
    <Sequence from={sceneStarts[5]} durationInFrames={sceneDurations[5]}><SceneApprove /></Sequence>
    <Sequence from={sceneStarts[6]} durationInFrames={sceneDurations[6]}><SceneEvidence /></Sequence>
    <Sequence from={sceneStarts[7]} durationInFrames={sceneDurations[7]}><SceneClose /></Sequence>
  </AbsoluteFill>;
}
