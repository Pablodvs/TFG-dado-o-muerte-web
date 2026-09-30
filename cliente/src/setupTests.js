import '@testing-library/jest-dom';
import i18n from './i18n';

// jsdom dice ser en-US, pero los tests comprueban los textos originales
beforeEach(() => i18n.changeLanguage('es'));
