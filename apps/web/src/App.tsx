import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon, type IconName } from './components/Icon'
import SubjectModuleFrame, { type SubjectId } from './components/SubjectModuleFrame'
import { askTutor } from './lib/api'
import { copy, type Language } from './content/translations'
import { evaluateCircuit, isChallengeComplete, type CircuitSlots, type PartName } from './logic/circuit'

type Screen = 'dashboard' | 'subjectLab' | 'mission' | 'workbench' | 'explain' | 'quiz' | 'reflect' | 'pulse'
type EventType = 'attempt' | 'hint' | 'complete'
type LearningEvent = { id: string; type: EventType; screen: Screen; groupId: string; detail: string; at: string; challenge?: number; subject?: SubjectId; classId?: string; activityId?: string }
const GROUPS = ['A', 'B', 'C', 'D']
const SLOT_POINTS = [{ x: 300, y: 70 }, { x: 520, y: 190 }, { x: 300, y: 310 }, { x: 80, y: 190 }]
const PARTS: PartName[] = ['battery', 'bulb', 'switch', 'wire']

function readStored<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch { return fallback }
}
function writeStored(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage may be disabled */ }
}

function AppHeader({ language, onLanguage, onPulse, onDashboard, t }: {
  language: Language; onLanguage: (language: Language) => void; onPulse: () => void; onDashboard: () => void; t: typeof copy.en
}) {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const onlineNow = () => setOnline(true)
    const offlineNow = () => setOnline(false)
    window.addEventListener('online', onlineNow)
    window.addEventListener('offline', offlineNow)
    return () => { window.removeEventListener('online', onlineNow); window.removeEventListener('offline', offlineNow) }
  }, [])
  const speak = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(document.querySelector('main')?.textContent ?? t.brand)
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
    window.speechSynthesis.speak(utterance)
  }
  return <header className="app-header">
    <div className="brand">
      <div className="brand-mark"><Icon name="spark" size={26} /></div>
      <div className="brand-copy"><span className="brand-name">{t.brand}</span><span className="brand-subject">{t.subject}</span></div>
    </div>
    <div className="header-actions">
      <span className={`status-chip ${online ? 'ok' : 'work'}`} aria-live="polite"><Icon name={online ? 'check' : 'pulse'} size={16} />{online ? t.online : t.offlineStatus}</span>
      <div className="language-switch" aria-label={t.language}>
        <button type="button" aria-pressed={language === 'en'} onClick={() => onLanguage('en')}>EN</button>
        <button type="button" aria-pressed={language === 'hi'} onClick={() => onLanguage('hi')}>हिं</button>
      </div>
      <button className="icon-button" type="button" aria-label={t.speaker} title={t.speaker} onClick={speak}><Icon name="speaker" /></button>
      <button className="icon-button" type="button" aria-label={t.pulse} title={t.pulse} onClick={onPulse}><Icon name="pulse" /></button>
      <button className="icon-button" type="button" aria-label={t.home} title={t.home} onClick={onDashboard}><Icon name="home" /></button>
    </div>
  </header>
}

function ClassNav({ selectedClass, onSelect, t }: { selectedClass: string; onSelect: (classId: string) => void; t: typeof copy.en }) {
  return <nav className="class-nav" aria-label={t.classNavLabel}>
    {t.classes.map((label, index) => {
      const classId = String(index + 6)
      return <button className="class-nav-button" type="button" key={classId} aria-pressed={selectedClass === classId} onClick={() => onSelect(classId)}>
        <span className="class-nav-number">{classId}</span><span>{label}</span><Icon name="arrow" size={18} />
      </button>
    })}
  </nav>
}

function SubjectSparkPanel({ subject, selectedClass, language, t }: {
  subject: SubjectId; selectedClass: string; language: Language; t: typeof copy.en
}) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [offline, setOffline] = useState(false)

  const submit = async () => {
    if (!question.trim()) return
    setLoading(true)
    setAnswer('')
    try {
      const response = await askTutor({
        subject,
        class_id: selectedClass,
        language,
        question: question.trim(),
      })
      setAnswer(response.answer)
      setOffline(!response.ai_used)
    } catch {
      setAnswer(language === 'hi'
        ? 'स्पार्क अभी उपलब्ध नहीं है। अनुमान लगाएँ, एक वर्चुअल सेटिंग बदलें और परिणाम की तुलना करें।'
        : 'Spark is unavailable. Make a prediction, change one virtual setting, and compare the result.')
      setOffline(true)
    } finally {
      setLoading(false)
    }
  }

  return <aside className="subject-spark">
    <button className="subject-spark-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span className="subject-spark-icon"><Icon name="spark" size={22} /></span>
      <strong>{t.sparkTutorTitle}</strong>
      <span>{open ? '−' : '+'}</span>
    </button>
    {open && <div className="subject-spark-body">
      <label>
        <span className="muted">{t.sparkTutorTitle}</span>
        <textarea className="textarea" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t.sparkTutorPlaceholder} />
      </label>
      <button className="btn btn-spark" type="button" disabled={loading || !question.trim()} onClick={submit}>
        {loading ? t.sparkThinking : t.sparkAsk}<Icon name="spark" size={20} />
      </button>
      {answer && <div className={offline ? 'panel-spark' : 'panel-success'} role="status">
        {offline && <strong>{t.sparkOffline}: </strong>}
        <span>{answer}</span>
      </div>}
    </div>}
  </aside>
}

function SubjectDashboard({ onOpenSubject, t }: { onOpenSubject: (subject: SubjectId) => void; t: typeof copy.en }) {
  const subjects: Array<{ id: SubjectId; title: string; icon: IconName }> = [
    { id: 'physics', title: t.subjectPhysics, icon: 'battery' },
    { id: 'chemistry', title: t.subjectChemistry, icon: 'spark' },
    { id: 'mathematics', title: t.subjectMathematics, icon: 'group' },
    { id: 'biology', title: t.subjectBiology, icon: 'bulb' },
  ]
  return <section className="page-content">
    <div className="page-heading"><span className="eyebrow">{t.subject}</span><h1>{t.subjectsTitle}</h1><p>{t.subjectsIntro}</p></div>
    <div className="subject-grid" aria-label={t.subjectsTitle}>
      {subjects.map((subject) => <button className="subject-card" type="button" key={subject.id} onClick={() => onOpenSubject(subject.id)}>
        <span className="subject-card-icon"><Icon name={subject.icon} size={30} /></span>
        <strong>{subject.title}</strong>
        <span>{t.openSubject}</span>
        <Icon name="arrow" size={18} />
      </button>)}
    </div>
  </section>
}

function MissionScreen({ language, prediction, saved, onPrediction, onSave, t }: {
  language: Language; prediction: number | null; saved: boolean; onPrediction: (index: number) => void; onSave: () => void; t: typeof copy.en
}) {
  return <section className="page-content">
    <div className="page-heading"><span className="eyebrow">{t.missionEyebrow}</span><h1>{t.missionTitle}</h1><p>{t.missionBody}</p></div>
    <div className="grid-two">
      <div className="mission-visual" role="img" aria-label={language === 'hi' ? 'घर में जलता हुआ दीपक' : 'A house with a glowing lamp'}>
        <svg className="mission-house" viewBox="0 0 360 260" aria-hidden="true">
          <path d="M40 125 180 25l140 100" fill="none" stroke="var(--ink)" strokeWidth="12" strokeLinejoin="round" />
          <path d="M66 117v112h228V117L180 35Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="5" />
          <rect x="142" y="145" width="76" height="84" rx="6" fill="var(--spark-soft)" stroke="var(--ink)" strokeWidth="5" />
          <path d="M180 145v84" stroke="var(--ink)" strokeWidth="4" />
          <path d="M142 185h76" stroke="var(--ink)" strokeWidth="4" />
          <path d="M180 105c-18 19-18 38 0 51 18-13 18-32 0-51Z" fill="var(--spark)" stroke="var(--copper-dark)" strokeWidth="4" />
          <circle cx="180" cy="130" r="43" fill="var(--spark)" opacity=".17" />
          <path d="M105 229h150" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="card">
        <span className="eyebrow">{t.stages[0]} · {t.predictStage}</span><h2>{t.predictTitle}</h2><p className="muted">{t.predictIntro}</p>
        <div className="option-list" role="radiogroup" aria-label={t.predictTitle}>
          {t.predictions.map((text, index) => <button className="option" type="button" role="radio" aria-checked={prediction === index} key={text} onClick={() => onPrediction(index)}>
            <span className="step-dot">{String.fromCharCode(65 + index)}</span><span>{text}</span>
          </button>)}
        </div>
        <div className="btn-row"><button className="btn btn-primary" type="button" disabled={prediction === null} onClick={onSave}>{saved ? t.predictionSaved : t.savePrediction}<Icon name="arrow" /></button></div>
      </div>
    </div>
  </section>
}

function CircuitPart({ part, x, y, lit, index, switchOpen, bulbCount, switchLabel }: { part: PartName; x: number; y: number; lit: boolean; index: number; switchOpen: boolean; bulbCount: number; switchLabel: string }) {
  return <g className="circuit-part" data-part={part} data-index={index} transform={`translate(${x} ${y})`}>
    {part === 'battery' && <>
      <rect x="-30" y="-18" width="68" height="44" rx="10" fill="var(--ink)" opacity=".24" transform="translate(4 6)" />
      <rect x="-34" y="-24" width="68" height="44" rx="10" fill="var(--copper)" stroke="var(--ink)" strokeWidth="4" />
      <rect x="-34" y="-24" width="22" height="44" rx="8" fill="var(--spark)" stroke="var(--ink)" strokeWidth="3" />
      <text className="svg-battery-polarity" x="5" y="5" fontWeight="900" fill="var(--surface)" textAnchor="middle">+ −</text>
    </>}
    {part === 'bulb' && <>
      {lit && <><circle r={46 + (bulbCount > 1 ? 5 : 15)} fill="var(--spark)" opacity={bulbCount > 1 ? .18 : .3} /><circle r="37" fill="var(--spark)" opacity=".34" /></>}
      <ellipse cx="4" cy="40" rx="21" ry="7" fill="var(--ink)" opacity=".22" />
      <rect x="-13" y="18" width="26" height="18" rx="4" fill="var(--ink)" />
      <circle cy="-4" r="27" fill={lit ? 'var(--spark)' : 'var(--paper)'} stroke="var(--ink)" strokeWidth="4" />
      <path d="M-9 18V7Q0-12 9 7V18M-7 23h14m-12 6h10" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="-10" cy="-14" r="5" fill="var(--surface)" opacity=".7" />
    </>}
    {part === 'switch' && <>
      <rect x="-36" y="-14" width="72" height="31" rx="9" fill="var(--ink)" opacity=".18" transform="translate(3 5)" />
      <rect x="-36" y="-17" width="72" height="31" rx="9" fill="var(--surface)" stroke="var(--ink)" strokeWidth="4" />
      <circle cx="-23" cy="-1" r="5" fill="var(--ink)" /><circle cx="23" cy="-1" r="5" fill="var(--ink)" />
      <line x1="-23" y1="-1" x2={switchOpen ? 15 : 23} y2={switchOpen ? -23 : -1} stroke={switchOpen ? 'var(--alert)' : 'var(--teal)'} strokeWidth="8" strokeLinecap="round" />
      <text className="svg-switch-label" y="42" fontWeight="900" textAnchor="middle" fill={switchOpen ? 'var(--alert)' : 'var(--teal)'}>{switchLabel}</text>
    </>}
    {part === 'wire' && <>
      <rect x="-34" y="-5" width="68" height="19" rx="9" fill="var(--ink)" opacity=".22" transform="translate(0 5)" />
      <rect x="-34" y="-11" width="68" height="19" rx="9" fill="var(--copper)" stroke="var(--ink)" strokeWidth="3" />
      <path d="M-23-6h34" stroke="var(--spark-soft)" strokeWidth="3" strokeLinecap="round" />
    </>}
  </g>
}

function WorkbenchScreen({ groupId, onEvent, onExplain, t }: {
  groupId: string; onEvent: (type: EventType, screen: Screen, detail: string, challenge?: number) => void; onExplain: () => void; t: typeof copy.en
}) {
  const [slots, setSlots] = useState<CircuitSlots>([null, null, null, null])
  const [switchOpen, setSwitchOpen] = useState(false)
  const [sawOff, setSawOff] = useState(false)
  const [selectedPart, setSelectedPart] = useState<PartName | null>(null)
  const [hintShown, setHintShown] = useState(false)
  const progressKey = `scb.${groupId}.challengeIndex`
  const doneKey = `scb.${groupId}.challengeDone`
  const [challengeIndex, setChallengeIndex] = useState(() => readStored(progressKey, 0))
  const [done, setDone] = useState<boolean[]>(() => readStored(doneKey, [false, false, false]))
  const [dragGhost, setDragGhost] = useState<{ part: PartName; x: number; y: number } | null>(null)
  const dragRef = useRef<{ part: PartName; x: number; y: number; dragging: boolean } | null>(null)
  const suppressClick = useRef(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const completeNotified = useRef(false)
  const evaluation = useMemo(() => evaluateCircuit(slots, switchOpen), [slots, switchOpen])
  const completed = isChallengeComplete(challengeIndex, evaluation, sawOff)
  const challengeCompleted = completed || Boolean(done[challengeIndex])
  const challengeTitle = t.challengeTitles[challengeIndex]
  const challengeGoal = t.challengeGoals[challengeIndex]

  useEffect(() => { writeStored(progressKey, challengeIndex); writeStored(doneKey, done) }, [progressKey, doneKey, challengeIndex, done])

  const logAttempt = useCallback((detail: string) => onEvent('attempt', 'workbench', detail, challengeIndex + 1), [onEvent, challengeIndex])
  const placePart = useCallback((slotIndex: number, part: PartName) => {
    setSlots((current) => current.map((item, index) => index === slotIndex ? part : item))
    if (part === 'switch') { setSwitchOpen(false); setSawOff(false) }
    setSelectedPart(null)
    setHintShown(false)
    logAttempt(`placed-${part}-slot-${slotIndex + 1}`)
  }, [logAttempt])
  const dropPart = useCallback((part: PartName, clientX: number, clientY: number) => {
    const rect = boardRef.current?.querySelector('svg')?.getBoundingClientRect()
    if (!rect) return
    const x = (clientX - rect.left) * 600 / rect.width
    const y = (clientY - rect.top) * 380 / rect.height
    let nearest = -1
    let distance = 96
    SLOT_POINTS.forEach((point, index) => {
      const nextDistance = Math.hypot(point.x - x, point.y - y)
      if (nextDistance < distance) { distance = nextDistance; nearest = index }
    })
    if (nearest >= 0) placePart(nearest, part)
  }, [placePart])

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const distance = Math.hypot(event.clientX - drag.x, event.clientY - drag.y)
      if (!drag.dragging && distance > 7) drag.dragging = true
      if (drag.dragging) setDragGhost({ part: drag.part, x: event.clientX, y: event.clientY })
    }
    const up = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      if (drag.dragging) {
        suppressClick.current = true
        dropPart(drag.part, event.clientX, event.clientY)
        window.setTimeout(() => { suppressClick.current = false }, 0)
      }
      dragRef.current = null
      setDragGhost(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [dropPart])

  useEffect(() => {
    if (evaluation.hasSwitch && evaluation.full && switchOpen) setSawOff(true)
  }, [evaluation, switchOpen])

  useEffect(() => {
    if (completed && !completeNotified.current) {
      completeNotified.current = true
      setDone((current) => current.map((value, index) => index === challengeIndex ? true : value))
      onEvent('complete', 'workbench', `challenge-${challengeIndex + 1}`, challengeIndex + 1)
    }
    if (!completed) completeNotified.current = false
  }, [completed, challengeIndex, onEvent])

  const handleSlot = (index: number) => {
    const current = slots[index]
    if (selectedPart) { placePart(index, selectedPart); return }
    if (current === 'switch') {
      const nextOpen = !switchOpen
      setSwitchOpen(nextOpen)
      if (nextOpen && evaluation.full) setSawOff(true)
      logAttempt(nextOpen ? 'switch-opened' : 'switch-closed')
      return
    }
    if (current) {
      setSlots((items) => items.map((item, itemIndex) => itemIndex === index ? null : item))
      logAttempt(`removed-${current}-slot-${index + 1}`)
    } else {
      setHintShown(false)
    }
  }

  const hintText = () => {
    if (!slots.some(Boolean)) return t.sparkStart
    if (!evaluation.battery) return t.sparkNoBattery
    if (evaluation.empty > 0) return t.sparkGaps(evaluation.empty)
    if (evaluation.switchOpen) return t.sparkOpen
    if (!evaluation.bulbs) return t.sparkNoBulb
    return evaluation.bulbs > 1 ? t.sparkTwo : t.sparkOne
  }
  const sparkText = hintShown ? t.sparkHint : hintText()
  const requestHint = () => { setHintShown(true); onEvent('hint', 'workbench', `hint-challenge-${challengeIndex + 1}`, challengeIndex + 1) }
  const resetBoard = () => { setSlots([null, null, null, null]); setSwitchOpen(false); setSawOff(false); setSelectedPart(null); setHintShown(false); logAttempt('reset-board') }
  const nextChallenge = () => {
    if (challengeIndex < 2) {
      setChallengeIndex((value) => value + 1)
      setSlots([null, null, null, null]); setSwitchOpen(false); setSawOff(false); setSelectedPart(null); setHintShown(false); completeNotified.current = false
    } else onExplain()
  }
  const partLabels = t.parts

  return <section className="workbench page-content" aria-label={t.workbenchTitle}>
    <div className="workbench-top">
      <div><span className="eyebrow">{t.subject}</span><h1>{t.workbenchTitle}</h1></div>
      <div className="stars" aria-label={`${done.filter(Boolean).length} ${t.stars}`}>
        {done.map((isDone, index) => <span className={`star ${isDone ? 'on' : ''}`} key={index}><Icon name="star" size={31} fill={isDone ? 'var(--spark)' : 'none'} /></span>)}
      </div>
    </div>
    <div className="goal-card">
      <span className="goal-icon"><Icon name="hint" size={26} /></span>
      <div><span className="goal-title">{t.challenge} {challengeIndex + 1} · {challengeTitle}</span><strong>{challengeGoal}</strong></div>
    </div>
    <div className="circuit-board" ref={boardRef}>
      <svg className="circuit-svg" viewBox="0 0 600 380" role="group" aria-label={t.boardLabel}>
        <title>{t.boardLabel}</title>
        <desc>{t.selectPart}</desc>
        <rect width="600" height="380" fill="var(--paper)" />
        {Array.from({ length: 15 }, (_, ix) => Array.from({ length: 9 }, (_, iy) => <circle key={`${ix}-${iy}`} cx={20 + ix * 40} cy={20 + iy * 40} r="2" fill="var(--line)" />))}
        <path d="M80 70H520V310H80Z" transform="translate(0 7)" fill="none" stroke="var(--ink)" strokeWidth="15" opacity=".16" />
        <path d="M80 70H520V310H80Z" fill="none" stroke="var(--ink)" strokeWidth="14" strokeLinejoin="round" />
        <path d="M80 70H520V310H80Z" fill="none" stroke={evaluation.powered ? 'var(--copper)' : 'var(--line)'} strokeWidth="8" strokeLinejoin="round" />
        {evaluation.powered && <path className="circuit-flow" d="M80 70H520V310H80Z" fill="none" stroke="var(--spark)" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 16" />}
        {slots.map((part, index) => {
          const { x, y } = SLOT_POINTS[index]
          return <g data-slot={index} key={index} role="button" aria-label={part ? `${t.remove} ${partLabels[part]}` : `${t.gap} ${index + 1}`} tabIndex={0}
            onClick={() => handleSlot(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleSlot(index) } }}>
            {!part ? <g className="circuit-gap"><circle cx={x} cy={y} r="35" fill="var(--surface)" stroke="var(--alert)" strokeWidth="3" strokeDasharray="7 6"/><path d={`M${x - 10} ${y}h20m-10 -10v20`} stroke="var(--alert)" strokeWidth="3" strokeLinecap="round" /></g>
              : <CircuitPart part={part} x={x} y={y} lit={evaluation.powered && part === 'bulb'} index={index} switchOpen={switchOpen} bulbCount={evaluation.bulbs} switchLabel={switchOpen ? t.switchOpen : t.switchClosed} />}
          </g>
        })}
      </svg>
    </div>
    <div className="parts-tray" aria-label={t.trayLabel}>
      {PARTS.map((part) => <button type="button" className="part-button" key={part} aria-pressed={selectedPart === part}
        onPointerDown={(event) => { dragRef.current = { part, x: event.clientX, y: event.clientY, dragging: false } }}
        onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } setSelectedPart((current) => current === part ? null : part); setHintShown(false) }}>
        <Icon name={part} size={29} /><span>{partLabels[part]}</span>
      </button>)}
    </div>
    <p className="muted">{selectedPart ? `${partLabels[selectedPart]} · ${t.selected}` : t.selectPart}</p>
    <div className="spark-panel">
      <span className="spark-dot"><Icon name="spark" size={24} /></span>
      <div><strong>{t.spark}</strong><div aria-live="polite">{sparkText}</div></div>
    </div>
    <div className="workbench-status">
      <span className={`status-chip ${evaluation.powered ? 'ok' : evaluation.empty > 0 ? 'stuck' : 'work'}`}>
        <Icon name={evaluation.powered ? 'check' : 'pulse'} size={17} />{evaluation.powered ? t.circuitPowered : t.circuitOff}
      </span>
    </div>
    {challengeCompleted && <div className="panel-success" role="status"><Icon name="star" size={20} /> {t.challengeWon} {challengeIndex === 2 ? t.allChallenges : ''}</div>}
    <div className="workbench-actions">
      <button className="btn" type="button" onClick={requestHint}><Icon name="hint" />{t.hint}</button>
      <button className="btn" type="button" onClick={resetBoard}><Icon name="reset" />{t.reset}</button>
      {challengeCompleted && <button className="btn btn-primary" type="button" onClick={nextChallenge}>{challengeIndex < 2 ? t.next : t.continueExplain}<Icon name="arrow" /></button>}
    </div>
    {dragGhost && <div className="drag-ghost" style={{ left: dragGhost.x, top: dragGhost.y }} aria-hidden="true"><Icon name={dragGhost.part} size={34} /></div>}
  </section>
}

function ExplainScreen({ t, onContinue }: { t: typeof copy.en; onContinue: () => void }) {
  const icons: IconName[] = ['battery', 'wire', 'bulb', 'switch']
  return <section className="page-content">
    <div className="page-heading"><span className="eyebrow">{t.stages[2]}</span><h1>{t.explainTitle}</h1><p>{t.explainIntro}</p></div>
    <div className="grid-two">
      {t.explainCards.map(([title, description], index) => <article className="card explain-card" key={title}>
        <span className="explain-icon"><Icon name={icons[index]} size={30} /></span><div><h3>{title}</h3><p className="muted">{description}</p></div>
      </article>)}
    </div>
    <div className="btn-row"><button className="btn btn-primary" type="button" onClick={onContinue}>{t.continueQuiz}<Icon name="arrow" /></button></div>
  </section>
}

function QuizScreen({ onFinish, onEvent, t }: { onFinish: (score: number) => void; onEvent: (type: EventType, screen: Screen, detail: string) => void; t: typeof copy.en }) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [hint, setHint] = useState(false)
  const question = t.questions[index]
  const choose = (choice: number) => {
    if (revealed) return
    setAnswer(choice); setRevealed(true)
    if (choice === question.correct) setScore((value) => value + 1)
    onEvent('attempt', 'quiz', `question-${index + 1}-answer-${choice + 1}`)
  }
  const next = () => {
    if (index === t.questions.length - 1) { onEvent('complete', 'quiz', 'quiz-finished'); onFinish(score) }
    else { setIndex((value) => value + 1); setAnswer(null); setRevealed(false); setHint(false) }
  }
  return <section className="page-content">
    <div className="page-heading"><span className="eyebrow">{t.stages[3]} · {index + 1}/{t.questions.length}</span><h1>{t.quizTitle}</h1><p>{t.quizIntro}</p></div>
    <div className="quiz-progress" aria-label={`${index + 1} of ${t.questions.length}`}><span style={{ transform: `scaleX(${(index + 1) / t.questions.length})` }} /></div>
    <article className="card">
      <h2>{question.q}</h2>
      <div className="option-list" role="radiogroup" aria-label={question.q}>
        {question.a.map((option, choice) => <button className={`option ${revealed && choice === question.correct ? 'is-correct' : ''} ${revealed && answer === choice && choice !== question.correct ? 'is-wrong' : ''}`} type="button" role="radio" aria-checked={answer === choice} key={option} onClick={() => choose(choice)} disabled={revealed}>
          <span className="step-dot">{String.fromCharCode(65 + choice)}</span><span>{option}</span>{revealed && choice === question.correct && <Icon name="check" />}
        </button>)}
      </div>
      {hint && <div className="panel-spark feedback">{question.hint}</div>}
      {revealed && <div className={`feedback ${answer === question.correct ? 'panel-success' : 'panel-alert'}`} role="status"><strong>{answer === question.correct ? t.correct : t.incorrect}</strong><p>{question.why}</p></div>}
      <div className="btn-row feedback">
        {!revealed && <button className="btn" type="button" onClick={() => { setHint(true); onEvent('hint', 'quiz', `question-${index + 1}-hint`) }}><Icon name="hint" />{t.hint}</button>}
        {revealed && <button className="btn btn-primary" type="button" onClick={next}>{index === t.questions.length - 1 ? t.finishQuiz : t.nextQuestion}<Icon name="arrow" /></button>}
      </div>
    </article>
  </section>
}

function ReflectScreen({ reflection, onChange, onSave, t }: { reflection: string; onChange: (value: string) => void; onSave: () => void; t: typeof copy.en }) {
  return <section className="page-content">
    <div className="page-heading"><span className="eyebrow">{t.stages[4]}</span><h1>{t.reflectTitle}</h1><p>{t.reflectIntro}</p></div>
    <div className="card"><textarea className="textarea" value={reflection} onChange={(event) => onChange(event.target.value)} placeholder={t.reflectPlaceholder} aria-label={t.reflectTitle} /><div className="btn-row feedback"><button className="btn btn-primary" type="button" onClick={onSave} disabled={!reflection.trim()}>{t.saveReflection}<Icon name="check" /></button></div></div>
  </section>
}

function PulseBoard({ events, groupId, onBack, t }: { events: LearningEvent[]; groupId: string; onBack: () => void; t: typeof copy.en }) {
  const groupEvents = events.filter((event) => event.groupId === groupId)
  const attempts = groupEvents.filter((event) => event.type === 'attempt').length
  const hints = groupEvents.filter((event) => event.type === 'hint').length
  const completed = groupEvents.filter((event) => event.type === 'complete').length
  const groups = GROUPS.map((id) => {
    const items = events.filter((event) => event.groupId === id)
    const finished = items.some((event) => event.screen === 'reflect' && event.type === 'complete')
    return { id, items, finished }
  })
  const recent = [...groupEvents].reverse().slice(0, 8)
  const subjectProgress = (['physics', 'chemistry', 'mathematics', 'biology'] as SubjectId[]).map((subject) => ({
    subject,
    completed: groupEvents.filter((event) => event.subject === subject && event.type === 'complete').length,
  }))
  return <section className="page-content">
    <div className="page-heading"><span className="eyebrow">{t.teacherView}</span><h1>{t.pulseTitle}</h1><p>{t.pulseIntro}</p></div>
    <div className="pulse-grid">
      <div className="metric"><span className="muted">{t.activity}</span><strong className="metric-value">{attempts}</strong></div>
      <div className="metric"><span className="muted">{t.hintsUsed}</span><strong className="metric-value">{hints}</strong></div>
      <div className="metric"><span className="muted">{t.challengesDone}</span><strong className="metric-value">{completed}</strong></div>
    </div>
    <article className="card">
      <h2>{t.subjectsTitle}</h2>
      {subjectProgress.map(({ subject, completed }) => <div className="pulse-group" key={subject}>
        <strong>{subject === 'physics' ? t.subjectPhysics : subject === 'chemistry' ? t.subjectChemistry : subject === 'mathematics' ? t.subjectMathematics : t.subjectBiology}</strong>
        <span className={`status-chip ${completed ? 'ok' : 'work'}`}>{completed}</span>
      </div>)}
    </article>
    <div className="grid-two">
      <article className="card"><h2>{t.groupProgress}</h2>{groups.map(({ id, items, finished }) => <div className="pulse-group" key={id}><strong>{t.group} {id}</strong><span className={`status-chip ${finished ? 'ok' : items.length ? 'work' : ''}`}><Icon name={finished ? 'check' : items.length ? 'pulse' : 'group'} size={16} />{finished ? t.statusComplete : items.length ? t.statusWorking : t.statusNotStarted}</span></div>)}</article>
      <article className="card"><h2>{t.recentEvents}</h2>{recent.length ? <div className="event-list">{recent.map((event) => <div className="event-item" key={event.id}><Icon name={event.type === 'hint' ? 'hint' : event.type === 'complete' ? 'check' : 'pulse'} /><span>{event.type === 'hint' ? t.eventHint : event.type === 'complete' ? t.eventComplete : t.eventAttempt}</span></div>)}</div> : <p className="muted">{t.noEvents}</p>}</article>
    </div>
    <div className="btn-row"><button className="btn btn-primary" type="button" onClick={onBack}><Icon name="back" />{t.backToLesson}</button></div>
  </section>
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => readStored<Language>('scb.language', 'en'))
  const [groupId] = useState<string>(() => readStored('scb.group', ''))
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>(() => readStored<SubjectId>('scb.subject', 'physics'))
  const [selectedClass, setSelectedClass] = useState<string>(() => readStored('scb.subjectClass', '6'))
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [prediction, setPrediction] = useState<number | null>(() => readStored('scb.prediction', null))
  const [predictionSaved, setPredictionSaved] = useState(() => readStored('scb.predictionSaved', false))
  const [reflection, setReflection] = useState(() => readStored('scb.reflection', ''))
  const [events, setEvents] = useState<LearningEvent[]>(() => readStored('scb.events', []))
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const t = copy[language]

  const changeLanguage = (next: Language) => { setLanguage(next); writeStored('scb.language', next) }
  const openSubject = (subject: SubjectId) => { setSelectedSubject(subject); writeStored('scb.subject', subject); setScreen('subjectLab') }
  const selectSubjectClass = (next: string) => { setSelectedClass(next); writeStored('scb.subjectClass', next); setScreen('subjectLab') }
  const logEvent = useCallback((type: EventType, eventScreen: Screen, detail: string, challenge?: number) => {
    setEvents((current) => {
      const next = [{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type, screen: eventScreen, groupId, detail, at: new Date().toISOString(), challenge }, ...current].slice(0, 300)
      writeStored('scb.events', next)
      return next
    })
  }, [groupId])
  const logSubjectProgress = useCallback((event: {
    subject: SubjectId; classId: string; activityId: string;
    type: 'activity_opened' | 'activity_completed' | 'quiz_completed'; score?: number;
  }) => {
    setEvents((current) => {
      const nextType: EventType = event.type === 'quiz_completed' || event.type === 'activity_completed' ? 'complete' : 'attempt'
      const detail = event.type === 'quiz_completed'
        ? `${event.activityId}-quiz-${event.score ?? 0}`
        : `${event.activityId}-${event.type}`
      const next = [{
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        type: nextType,
        screen: 'subjectLab' as Screen,
        groupId,
        detail,
        at: new Date().toISOString(),
        subject: event.subject,
        classId: event.classId,
        activityId: event.activityId,
      }, ...current].slice(0, 300)
      writeStored('scb.events', next)
      return next
    })
  }, [groupId])
  const savePrediction = () => {
    if (prediction === null) return
    setPredictionSaved(true); writeStored('scb.prediction', prediction); writeStored('scb.predictionSaved', true)
    logEvent('attempt', 'mission', `prediction-${prediction + 1}`)
    setScreen('workbench')
  }
  const saveReflection = () => {
    writeStored('scb.reflection', reflection)
    logEvent('complete', 'reflect', 'reflection-saved')
    setScreen('pulse')
  }
  return <div className="app-shell">
    <AppHeader language={language} onLanguage={changeLanguage} onPulse={() => setScreen('pulse')} onDashboard={() => setScreen('dashboard')} t={t} />
    {screen === 'subjectLab' && <ClassNav selectedClass={selectedClass} onSelect={selectSubjectClass} t={t} />}
    {screen === 'subjectLab' && <SubjectSparkPanel subject={selectedSubject} selectedClass={selectedClass} language={language} t={t} />}
    {screen === 'subjectLab' ? <SubjectModuleFrame subject={selectedSubject} selectedClass={selectedClass} language={language} onProgress={logSubjectProgress} /> : <main>
      {screen === 'dashboard' && <SubjectDashboard onOpenSubject={openSubject} t={t} />}
      {screen === 'mission' && <MissionScreen language={language} prediction={prediction} saved={predictionSaved} onPrediction={(value) => { setPrediction(value); setPredictionSaved(false) }} onSave={savePrediction} t={t} />}
      {screen === 'workbench' && <WorkbenchScreen key={groupId} groupId={groupId} onEvent={logEvent} onExplain={() => setScreen('explain')} t={t} />}
      {screen === 'explain' && <ExplainScreen t={t} onContinue={() => setScreen('quiz')} />}
      {screen === 'quiz' && <QuizScreen onEvent={logEvent} onFinish={(score) => { setQuizScore(score); writeStored('scb.quizScore', score); setScreen('reflect') }} t={t} />}
      {screen === 'reflect' && <ReflectScreen reflection={reflection} onChange={(value) => { setReflection(value); writeStored('scb.reflection', value) }} onSave={saveReflection} t={t} />}
      {screen === 'pulse' && <PulseBoard events={events} groupId={groupId} onBack={() => setScreen('mission')} t={t} />}
    </main>}
    <p className="footer-note">{t.offline}{quizScore !== null ? ` · ${t.score}: ${quizScore}/5` : ''}</p>
  </div>
}
