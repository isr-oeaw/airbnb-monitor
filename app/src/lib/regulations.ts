import regulationsData from '../data/bundeslaender-regulations.json';
import type { BundeslandId, BundeslandRegulation, BundeslandRegulations } from '../types/regulation';

const regulations = regulationsData as BundeslandRegulations;

export function getRegulation(bundeslandId: BundeslandId): BundeslandRegulation {
  return regulations[bundeslandId];
}
