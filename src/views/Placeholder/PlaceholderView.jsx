import { Hammer } from 'lucide-react';
import { EmptyState } from '../../components/ui';

/** Pantalla temporal para módulos que hace otro integrante del equipo. */
export default function PlaceholderView({ title, task, owner }) {
  return (
    <section className="view">
      <h1 className="page-title">{title}</h1>
      <EmptyState icon={Hammer} title={`En construcción · ${task}`}>
        Este módulo lo está desarrollando {owner}. Reemplaza este componente en <code>App.jsx</code> cuando esté listo.
      </EmptyState>
    </section>
  );
}
