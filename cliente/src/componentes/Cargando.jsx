import { useTranslation } from 'react-i18next';
import Logo from './Logo';

export default function Cargando({ texto }) {
    const { t } = useTranslation();
    return (
        <div className="cargando">
            <Logo className="cargando__logo" />
            <p className="cargando__texto" role="status">{texto ?? t('comun.cargando')}</p>
        </div>
    );
}
