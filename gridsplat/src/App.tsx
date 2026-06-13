import {
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
import {
  DropdownMenu,
  type DropdownMenuItem,
} from './components/DropdownMenu';
import { IconButton } from './components/IconButton';
import { Toast } from './components/Toast';
import { Tooltip } from './components/Tooltip';
import { SpreadsheetGrid } from './grid/SpreadsheetGrid';
import { cloudProviders } from './io/cloud/providers';
import type { SheetMatrix } from './io/matrix';
import { PictureGraph } from './picturegraph/PictureGraph';
import { PresentationMode } from './present/PresentationMode';
import { strings } from './i18n/strings';
import { TemplatesLibrary } from './templates/TemplatesLibrary';
import {
  spreadsheetTemplates,
  type SpreadsheetTemplate,
} from './templates/templates';

type DialogKind =
  | 'activity'
  | 'help'
  | 'picture'
  | 'privacy'
  | 'slides'
  | 'templates'
  | null;
type ChartKind = 'bar' | 'line' | 'pie' | 'scatter';
type ExportFormat = 'json' | 'csv' | 'markdown' | 'xlsx';
type GridAction =
  | { action: 'chart'; chartType: ChartKind }
  | { action: 'chart-title'; title: string }
  | { action: 'export-file'; format: ExportFormat }
  | {
      action:
        | 'cloud-open'
        | 'cloud-save'
        | 'copy'
        | 'export-chart'
        | 'new-sheet'
        | 'open-file'
        | 'paste'
        | 'redo'
        | 'save-file'
        | 'undo';
      providerName?: string;
    };

const cloudProviderNames = cloudProviders
  .map((provider) => provider.name)
  .sort((firstProvider, secondProvider) =>
    firstProvider.localeCompare(secondProvider),
  );

const toolbarMenus = [
  {
    label: 'File',
    items: [
      'New sheet',
      'Start over',
      {
        label: 'Open',
        children: [
          'Import file',
          ...cloudProviderNames.map((providerName) => `Open ${providerName}`),
        ],
      },
      {
        label: 'Save',
        children: [
          'Save file',
          ...cloudProviderNames.map((providerName) => `Save ${providerName}`),
        ],
      },
      {
        label: 'Export',
        children: [
          'Chart PNG',
          'CSV',
          'Excel',
          'JSON',
          'Markdown',
        ],
      },
    ],
  },
  {
    label: 'Edit',
    items: ['Undo', 'Redo', 'Copy', 'Paste'],
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
    items: [
      'Browse activities',
      ...activities.map((activity) => activity.title),
      'Teacher ideas',
    ],
  },
  {
    label: 'Templates',
    items: [
      'Browse templates',
      ...spreadsheetTemplates.map((template) => template.title),
    ],
  },
  {
    label: 'Present',
    items: ['Whiteboard slides'],
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

type MenuItemConfig = string | { children: string[]; label: string };

function buildMenuItems(
  items: MenuItemConfig[],
  onSelect: (label: string) => void,
): DropdownMenuItem[] {
  return items.map((item) =>
    typeof item === 'string'
      ? {
          label: item,
          onSelect: () => onSelect(item),
        }
      : {
          label: item.label,
          children: item.children.map((child) => ({
            label: child,
            onSelect: () => onSelect(child),
          })),
        },
  );
}

export function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [dialogKind, setDialogKind] = useState<DialogKind>(null);
  const [sheetMatrix, setSheetMatrix] = useState<SheetMatrix | null>(null);
  const [chartTitle, setChartTitle] = useState('My Chart');

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2200);
  }

  function dispatchGridAction(detail: GridAction) {
    window.dispatchEvent(
      new CustomEvent<GridAction>('gridsplat:grid-action', { detail }),
    );
  }

  function handleMenuAction(label: string) {
    if (label === 'New sheet') {
      dispatchGridAction({ action: 'new-sheet' });
      return;
    }

    if (label === 'Import file') {
      dispatchGridAction({ action: 'open-file' });
      return;
    }

    if (label === 'Save file') {
      dispatchGridAction({ action: 'save-file' });
      return;
    }

    if (label === 'Chart PNG') {
      dispatchGridAction({ action: 'export-chart' });
      return;
    }

    if (label === 'CSV') {
      dispatchGridAction({ action: 'export-file', format: 'csv' });
      return;
    }

    if (label === 'Excel') {
      dispatchGridAction({ action: 'export-file', format: 'xlsx' });
      return;
    }

    if (label === 'JSON') {
      dispatchGridAction({ action: 'export-file', format: 'json' });
      return;
    }

    if (label === 'Markdown') {
      dispatchGridAction({ action: 'export-file', format: 'markdown' });
      return;
    }

    if (label === 'Start over') {
      dispatchGridAction({ action: 'new-sheet' });
      return;
    }

    const cloudProvider = cloudProviders.find((provider) =>
      label.endsWith(provider.name),
    );

    if (cloudProvider && label.startsWith('Open ')) {
      dispatchGridAction({
        action: 'cloud-open',
        providerName: cloudProvider.name,
      });
      return;
    }

    if (cloudProvider && label.startsWith('Save ')) {
      dispatchGridAction({
        action: 'cloud-save',
        providerName: cloudProvider.name,
      });
      return;
    }

    if (label === 'Undo') {
      dispatchGridAction({ action: 'undo' });
      return;
    }

    if (label === 'Redo') {
      dispatchGridAction({ action: 'redo' });
      return;
    }

    if (label === 'Copy') {
      dispatchGridAction({ action: 'copy' });
      return;
    }

    if (label === 'Paste') {
      dispatchGridAction({ action: 'paste' });
      return;
    }

    if (label === 'Formula') {
      showToast('Type =SUM(A1:A5) or another formula in any cell.');
      return;
    }

    if (label === 'Picture graph') {
      setDialogKind('picture');
      return;
    }

    if (label === 'Bar chart') {
      dispatchGridAction({ action: 'chart', chartType: 'bar' });
      return;
    }

    if (label === 'Line chart') {
      dispatchGridAction({ action: 'chart', chartType: 'line' });
      return;
    }

    if (label === 'Pie chart') {
      dispatchGridAction({ action: 'chart', chartType: 'pie' });
      return;
    }

    if (label === 'Scatter plot') {
      dispatchGridAction({ action: 'chart', chartType: 'scatter' });
      return;
    }

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

    if (label === 'Whiteboard slides') {
      setDialogKind('slides');
      return;
    }

    if (label === 'Browse templates') {
      setDialogKind('templates');
      return;
    }

    const selectedTemplate = spreadsheetTemplates.find(
      (template) => template.title === label,
    );

    if (selectedTemplate) {
      loadTemplate(selectedTemplate);
      return;
    }

    if (label === 'Browse activities') {
      setDialogKind('activity');
      return;
    }

    const selectedActivity = activities.find(
      (activity) => activity.title === label,
    );

    if (selectedActivity) {
      loadActivity(selectedActivity);
      return;
    }

    showToast(`${label} is not available yet.`);
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

  function loadTemplate(template: SpreadsheetTemplate) {
    window.dispatchEvent(
      new CustomEvent('gridsplat:load-matrix', {
        detail: template.sampleData,
      }),
    );
    setDialogKind(null);
    setIsSplashVisible(false);
    showToast(`Loaded ${template.title}.`);
  }

  function changeChartTitle(title: string) {
    setChartTitle(title);
    dispatchGridAction({ action: 'chart-title', title });
  }

  function makeChart(chartType: ChartKind) {
    dispatchGridAction({ action: 'chart', chartType });
  }

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
              onClick={() => dispatchGridAction({ action: 'new-sheet' })}
            >
              New
            </IconButton>
          </Tooltip>
          <Tooltip text="Open a spreadsheet file">
            <IconButton
              icon={<FolderOpen aria-hidden="true" size={22} />}
              onClick={() => dispatchGridAction({ action: 'open-file' })}
            >
              Open
            </IconButton>
          </Tooltip>
          <Tooltip text="Save work to this device">
            <IconButton
              icon={<Save aria-hidden="true" size={22} />}
              onClick={() => dispatchGridAction({ action: 'save-file' })}
            >
              Save
            </IconButton>
          </Tooltip>
        </div>
      </header>

      <section className="chart-picker top-chart-tools" aria-label="Chart tools">
        <label className="chart-title-field">
          Chart title
          <input
            value={chartTitle}
            onChange={(event) => changeChartTitle(event.target.value)}
          />
        </label>
        {(['bar', 'line', 'pie', 'scatter'] as ChartKind[]).map((type) => (
          <button
            className="chart-type-button"
            key={type}
            type="button"
            onClick={() => makeChart(type)}
          >
            <span className={`chart-preview ${type}`} aria-hidden="true" />
            {type[0].toUpperCase()}
            {type.slice(1)}
          </button>
        ))}
      </section>

      <nav className="top-toolbar" aria-label="Main toolbar">
        {toolbarMenus.map((menu) => (
          <DropdownMenu
            items={buildMenuItems(menu.items, handleMenuAction)}
            key={menu.label}
            label={menu.label}
          />
        ))}
      </nav>

      <SpreadsheetGrid onSheetUpdated={setSheetMatrix} />

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
                  onClick={() => {
                    setIsSplashVisible(false);
                    dispatchGridAction({ action: 'open-file' });
                  }}
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
        title="Classroom Activities"
        onClose={() => setDialogKind(null)}
        variant="wide"
      >
        <ActivitiesLibrary onLoadActivity={loadActivity} />
      </Dialog>

      <Dialog
        isOpen={dialogKind === 'picture'}
        title="Picture Graph"
        onClose={() => setDialogKind(null)}
        variant="wide"
      >
        <PictureGraph initialMatrix={sheetMatrix} />
      </Dialog>

      <Dialog
        isOpen={dialogKind === 'templates'}
        title="Spreadsheet Templates"
        onClose={() => setDialogKind(null)}
        variant="wide"
      >
        <TemplatesLibrary onLoadTemplate={loadTemplate} />
      </Dialog>

      <Dialog
        isOpen={dialogKind === 'slides'}
        title="Whiteboard Slides"
        onClose={() => setDialogKind(null)}
        variant="wide"
      >
        <PresentationMode />
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
