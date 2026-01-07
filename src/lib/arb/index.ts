// src/lib/arb/index.ts
export { 
  detectBookVsBookArbs, 
  detectBookVsBetfairArbs, 
  detectAllOpportunities 
} from './detector';
export {
  calculateBookVsBookStakes,
  calculateBookVsBetfairStakes,
  calculateBookVsBetfairFromTotal,
  validateArbitrage,
  validateBetfairArbitrage,
  formatBookVsBookAsCopyText,
  formatBookVsBetfairAsCopyText,
} from './calculator';
