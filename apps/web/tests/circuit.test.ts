import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateCircuit, isChallengeComplete, type CircuitSlots } from '../src/logic/circuit.ts'

const completeOne: CircuitSlots = ['battery', 'bulb', 'wire', 'wire']

test('no battery keeps the bulb off', () => {
  assert.equal(evaluateCircuit(['wire', 'bulb', 'wire', 'wire'], false).powered, false)
})

test('no bulb keeps the circuit unpowered', () => {
  assert.equal(evaluateCircuit(['battery', 'wire', 'wire', 'wire'], false).powered, false)
})

test('a missing gap keeps the circuit unpowered', () => {
  assert.equal(evaluateCircuit(['battery', 'bulb', 'wire', null], false).powered, false)
})

test('an open installed switch turns the bulb off', () => {
  assert.equal(evaluateCircuit(['battery', 'bulb', 'wire', 'switch'], true).powered, false)
})

test('a complete loop with a closed switch powers the bulb', () => {
  assert.equal(evaluateCircuit(['battery', 'bulb', 'wire', 'switch'], false).powered, true)
})

test('two bulbs can be evaluated for challenge two', () => {
  const evaluation = evaluateCircuit(['battery', 'bulb', 'bulb', 'wire'], false)
  assert.equal(evaluation.bulbs, 2)
  assert.equal(isChallengeComplete(1, evaluation, false), true)
})

test('challenge three requires the switch to have been opened before closing', () => {
  const closed = evaluateCircuit(['battery', 'bulb', 'wire', 'switch'], false)
  assert.equal(isChallengeComplete(2, closed, false), false)
  assert.equal(isChallengeComplete(2, closed, true), true)
})

test('the reference one-bulb circuit lights when complete', () => {
  assert.equal(evaluateCircuit(completeOne, false).powered, true)
})
