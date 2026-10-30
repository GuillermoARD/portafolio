import { useApi } from '../hooks/useApi';
import { getSkills } from '../lib/api';
import { SectionHeading } from './SectionHeading';
import { SkillIcon } from './SkillIcon';
import { SkillLogo } from './SkillLogo';

export function Skills() {
  const state = useApi(getSkills, (r) => r.skillGroups);

  return (
    <section id="habilidades" className="section section--alt" aria-labelledby="habilidades-title">
      <div className="container">
        <SectionHeading
          id="habilidades-title"
          eyebrow="02"
          title="Habilidades"
          subtitle="Las herramientas con las que trabajo a diario."
        />

        {state.status === 'loading' && (
          <div className="skills" aria-busy="true" aria-label="Cargando habilidades">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="card skeleton" style={{ height: 140 }} />
            ))}
          </div>
        )}

        {state.status === 'error' && <p className="load-error">No se pudieron cargar las habilidades. {state.error}</p>}

        {state.status === 'ready' && (
          <div className="skills">
            {state.data.map((group, i) => (
              <div key={group.id} className="skills__item" data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                <article className="card skills__group">
                  <div className="skills__head">
                    <span className="skill-icon">
                      <SkillIcon icon={group.icon} />
                    </span>
                    <h3>{group.title}</h3>
                  </div>
                  <ul className="chips">
                    {group.skills.map((skill) => (
                      <li key={skill.name} className="chip chip--logo">
                        <SkillLogo name={skill.name} logo={skill.logo} />
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
