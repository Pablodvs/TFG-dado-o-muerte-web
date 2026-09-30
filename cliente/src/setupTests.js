import '@testing-library/jest-dom';
import i18n from './i18n';

// La app sale en inglés, pero los tests comprueban los textos originales en castellano
beforeEach(() => i18n.changeLanguage('es'));
