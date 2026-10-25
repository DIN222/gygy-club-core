// modules/ambient.js
// v2.0.0 — совместимость: вся логика звука переехала в modules/soundscape.js,
// а что и где играет, решает таблица core/soundScenario.js.

export { startAmbient, stopAmbient } from './soundscape.js';

export function resumeAmbient() {
    // Сценарий (core/soundScenario.js) сам решает, играть ли фон на этой странице.
}
