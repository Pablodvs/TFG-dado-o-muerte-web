import '@testing-library/jest-dom/vitest';
import i18n from './i18n';

// Testing Library solo adelanta los temporizadores falsos en findBy/waitFor si
// ve un objeto global `jest`; con esto hace lo mismo con los de Vitest
globalThis.jest = { advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms) };

// La app sale en inglés, pero los tests comprueban los textos originales en castellano
beforeEach(() => i18n.changeLanguage('es'));
