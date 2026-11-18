export type PartName = 'battery' | 'bulb' | 'switch' | 'wire'
export type CircuitSlots = Array<PartName | null>

export type CircuitEvaluation = {
  battery: boolean
  bulbs: number
  empty: number
  hasSwitch: boolean
  switchOpen: boolean
  full: boolean
  powered: boolean
}

/** Deterministic classroom model for the four-gap circuit loop. */
export function evaluateCircuit(slots: CircuitSlots, switchOpen: boolean): CircuitEvaluation {
  const battery = slots.includes('battery')
  const bulbs = slots.filter((part) => part === 'bulb').length
  const empty = slots.filter((part) => part === null).length
  const hasSwitch = slots.includes('switch')
  const isSwitchOpen = hasSwitch && switchOpen
  const full = empty === 0
  const powered = battery && bulbs > 0 && full && !isSwitchOpen

  return {
    battery,
    bulbs,
    empty,
    hasSwitch,
    switchOpen: isSwitchOpen,
    full,
    powered,
  }
}

export function isChallengeComplete(
  challengeIndex: number,
  evaluation: CircuitEvaluation,
  sawSwitchOff: boolean,
): boolean {
  if (challengeIndex === 0) return evaluation.powered && evaluation.bulbs >= 1
  if (challengeIndex === 1) return evaluation.powered && evaluation.bulbs >= 2
  return evaluation.powered && evaluation.hasSwitch && sawSwitchOff
}
