import { useState } from 'react';
import { activities, projectIdeas, type Activity } from './activities';

function loadActivity(activity: Activity) {
  window.dispatchEvent(
    new CustomEvent('gridsplat:load-matrix', {
      detail: activity.sampleData,
    }),
  );
}

export function ActivitiesLibrary() {
  const [openNotes, setOpenNotes] = useState<string | null>(null);

  return (
    <section className="activities-library" aria-labelledby="activities-title">
      <header className="module-header">
        <div>
          <p className="eyebrow">Activities</p>
          <h2 id="activities-title">Classroom Activities</h2>
        </div>
      </header>
      <div className="activities-grid">
        {activities.map((activity) => (
          <article className="activity-card" key={activity.id}>
            <p className="activity-grade">{activity.gradeBand}</p>
            <h3>{activity.title}</h3>
            <p>{activity.instructions}</p>
            <p className="activity-teks">TEKS: {activity.teks.join(', ')}</p>
            <div className="activity-actions">
              <button
                className="big-action"
                type="button"
                onClick={() => loadActivity(activity)}
              >
                Load Activity
              </button>
              <button
                className="big-action secondary"
                type="button"
                onClick={() =>
                  setOpenNotes((current) =>
                    current === activity.id ? null : activity.id,
                  )
                }
              >
                Teacher Notes
              </button>
            </div>
            {openNotes === activity.id ? (
              <p className="teacher-notes">{activity.teacherNotes}</p>
            ) : null}
          </article>
        ))}
      </div>
      <div className="project-ideas">
        <h3>Project Ideas</h3>
        <ul>
          {projectIdeas.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
