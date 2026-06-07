import {
  Activity as ActivityIcon,
  BarChart3,
  FilePlus2,
  FolderOpen,
  HelpCircle,
  MonitorUp,
  Save,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

import { BigButton } from './components/BigButton';
import { ActivitiesLibrary } from './activities/ActivitiesLibrary';
import { activities, type Activity } from './activities/activities';
import { Dialog } from './components/Dialog';
import { DropdownMenu } from './components/DropdownMenu';
import { IconButton } from './components/IconButton';
import { Toast } from './components/Toast';
import { Tooltip } from './components/Tooltip';
import { SpreadsheetGrid } from './grid/SpreadsheetGrid';
import { PictureGraph } from './picturegraph/PictureGraph';
import { PresentationMode } from './present/PresentationMode';
import { strings } from './i18n/strings';
import { TemplatesLibrary } from './templates/TemplatesLibrary';

type DialogKind = 'activity' | 'help' | 'privacy' | null;

const toolbarMenus = [
  {
    label: 'File',
    items: ['New sheet', 'Open file', 'Save local copy'],
  },
  {
    label: 'Edit',
    items: ['Undo', 'Copy', 'Paste'],
  },
  {
    label: 'Insert',
    items: ['Formula', 'Picture graph', 'Note'],
  },
  {
    label: 'Chart',
    items: ['Bar chart', 'Line chart', 'Pie chart', 'Scatter plot'],
  },
  {
    label: 'Activities',
    items: ['Try an activity', 'Templates', 'Teacher ideas', 'Sample data'],
  },
  {
    label: 'Present',
    items: ['Start presentation', 'Whiteboard view'],
  },
  {
    label: 'Help',
    items: [
      'Quick help',
      'Keyboard help',
      'Replay tour',
      'Privacy & safety',
      'About GridSplat™',
    ],
  },
];

export function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [dialogKind, setDialogKind] = useState<DialogKind>(null);

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2200);
  }

  function handleMenuAction(label: string) {
    if (
      label === 'Quick help' ||
      label === 'Keyboard help' ||
      label === 'About GridSplat™'
    ) {
      setDialogKind('help');
      return;
    }

    if (label === 'Privacy & safety') {
      setDialogKind('privacy');
      return;
    }

    if (label === 'Replay tour') {
      setIsSplashVisible(true);
      return;
    }

    if (label === 'Start presentation' || label === 'Whiteboard view') {
      document
        .getElementById('present-title')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Presentation tools are ready below.');
      return;
    }

    if (label === 'Templates') {
      document
        .getElementById('templates-title')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Templates are ready below.');
      return;
    }

    if (label === 'Try an activity' || label === 'Sample data') {
      setDialogKind('activity');
      return;
    }

    showToast(`${label} will be built in a later module.`);
  }

  function loadActivity(activity: Activity) {
    window.dispatchEvent(
      new CustomEvent('gridsplat:load-matrix', {
        detail: activity.sampleData,
      }),
    );
    setDialogKind(null);
    setIsSplashVisible(false);
    showToast(`Loaded ${activity.title}.`);
  }

  const classSurveyActivity = activities.find(
    (activity) => activity.id === 'class-pet-survey',
  );
  const weatherActivity = activities.find(
    (activity) => activity.id === 'daily-temperature',
  );

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <header className="app-header">
        <div className="brand-lockup">
          <img
            alt=""
            className="brand-icon"
            src={`${import.meta.env.BASE_URL}gridsplat_icon.png`}
          />
          <div>
            <p className="eyebrow">
              GridSplat™ by{' '}
              <a href="../pages/gridsplat.html">
                DrawSplat™
              </a>
            </p>
            <h1 id="app-title">GridSplat™</h1>
            <p className="intro">{strings.tagline}</p>
          </div>
        </div>
        <div className="header-actions" aria-label="Quick actions">
          <Tooltip text="Start a new classroom sheet">
            <IconButton
              icon={<FilePlus2 aria-hidden="true" size={22} />}
              onClick={() => showToast('New sheet ready.')}
            >
              New
            </IconButton>
          </Tooltip>
          <Tooltip text="Open a spreadsheet file">
            <IconButton
              icon={<FolderOpen aria-hidden="true" size={22} />}
              onClick={() => showToast('File opening arrives in Module 8.')}
            >
              Open
            </IconButton>
          </Tooltip>
          <Tooltip text="Save work to this device">
            <IconButton
              icon={<Save aria-hidden="true" size={22} />}
              onClick={() => showToast('Local saving arrives in Module 9.')}
            >
              Save
            </IconButton>
          </Tooltip>
        </div>
      </header>

      <nav className="top-toolbar" aria-label="Main toolbar">
        {toolbarMenus.map((menu) => (
          <DropdownMenu
            items={menu.items.map((item) => ({
              label: item,
              onSelect: () => handleMenuAction(item),
            }))}
            key={menu.label}
            label={menu.label}
          />
        ))}
      </nav>

      <SpreadsheetGrid />
      <PictureGraph />
      <ActivitiesLibrary />
      <TemplatesLibrary />
      <PresentationMode />

      {isSplashVisible ? (
        <section
          aria-labelledby="welcome-title"
          aria-modal="true"
          className="splash-backdrop"
          role="dialog"
        >
          <div className="splash-panel">
            <img
              alt=""
              className="splash-image"
              src={`${import.meta.env.BASE_URL}gridsplat_splash.png`}
            />
            <div className="splash-content">
              <p className="eyebrow">Welcome</p>
              <h2 id="welcome-title">GridSplat™</h2>
              <p className="splash-copy">
                GridSplat™ by{' '}
                <a
                  href="../pages/gridsplat.html"
                >
                  DrawSplat™
                </a>
                . {strings.tagline}
              </p>
              <div className="tour-list" aria-label="First tour steps">
                <span>1. Type data in the grid.</span>
                <span>2. Make a chart or picture graph.</span>
                <span>3. Save locally or present to the class.</span>
              </div>
              <div className="splash-actions">
                <BigButton
                  icon={<FilePlus2 aria-hidden="true" size={24} />}
                  onClick={() => {
                    setIsSplashVisible(false);
                    showToast('New sheet ready.');
                  }}
                >
                  New Sheet
                </BigButton>
                <BigButton
                  icon={<FolderOpen aria-hidden="true" size={24} />}
                  variant="secondary"
                  onClick={() => showToast('File opening arrives in Module 8.')}
                >
                  Open a File
                </BigButton>
                <BigButton
                  icon={<Sparkles aria-hidden="true" size={24} />}
                  variant="secondary"
                  onClick={() => setDialogKind('activity')}
                >
                  Try an Activity
                </BigButton>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <Dialog
        isOpen={dialogKind === 'activity'}
        title="Try an Activity"
        onClose={() => setDialogKind(null)}
      >
        <div className="dialog-grid">
          <article>
            <ActivityIcon aria-hidden="true" size={28} />
            <h3>Class Survey</h3>
            <p>Collect favorites, count totals, and build a chart next.</p>
            {classSurveyActivity ? (
              <button
                className="big-action"
                type="button"
                onClick={() => loadActivity(classSurveyActivity)}
              >
                Load Class Survey
              </button>
            ) : null}
          </article>
          <article>
            <BarChart3 aria-hidden="true" size={28} />
            <h3>Weather Data</h3>
            <p>Type daily temperatures and compare the numbers.</p>
            {weatherActivity ? (
              <button
                className="big-action"
                type="button"
                onClick={() => loadActivity(weatherActivity)}
              >
                Load Weather Data
              </button>
            ) : null}
          </article>
        </div>
      </Dialog>

      <Dialog
        isOpen={dialogKind === 'help'}
        title="GridSplat™ Help"
        onClose={() => setDialogKind(null)}
      >
        <div className="help-list">
          <section>
            <h3>Sheet basics</h3>
            <p>Use arrow keys to move around the sheet.</p>
            <p>Press Enter to edit a selected cell.</p>
            <p>Paste a copied table to fill many cells at once.</p>
            <p>Use Undo when you want to try again.</p>
          </section>
          <section>
            <h3>Charts and picture graphs</h3>
            <p>Select data, choose a chart type, then export a PNG.</p>
            <p>
              Use the pictograph scale box to change what each picture means.
            </p>
          </section>
          <section>
            <h3>Templates</h3>
            <p>
              Use everyday templates for reading logs, homework, science
              observations, allowance tracking, check registers, budgets, and
              gradebooks.
            </p>
          </section>
          <section>
            <h3>Presentation and offline use</h3>
            <p>Build whiteboard slides from the presentation panel.</p>
            <p>
              GridSplat™ can load again offline after the first successful
              visit.
            </p>
          </section>
        </div>
      </Dialog>

      <Dialog
        isOpen={dialogKind === 'privacy'}
        title="Privacy & Safety"
        onClose={() => setDialogKind(null)}
      >
        <div className="help-list">
          <section>
            <h3>No default cloud storage</h3>
            <p>
              Student work stays in the browser unless someone saves a file or
              connects their own cloud account.
            </p>
          </section>
          <section>
            <h3>No trackers</h3>
            <p>{strings.privacyNoTrackers}</p>
          </section>
          <section>
            <h3>Teacher review</h3>
            <p>
              TEKS tags are included as source-linked classroom metadata and
              coded math standards were checked against TEA/TAC sources on June
              7, 2026. Science activities remain aligned in spirit until
              educator review.
            </p>
          </section>
        </div>
      </Dialog>

      <Toast message={toastMessage} />

      <div className="presentation-hint print-note" aria-hidden="true">
        <MonitorUp size={20} />
        <span>
          GridSplat™ by{' '}
          <a href="../pages/gridsplat.html">
            DrawSplat™
          </a>
        </span>
        <HelpCircle size={20} />
      </div>
    </main>
  );
}
