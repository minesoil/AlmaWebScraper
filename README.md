# Compass
A personal coursework log for assignments, deadlines and individual scores. The first release accepts manual entries and Compass JSON backups. Use one browser tab for editing. The browser stores the log on this device and origin. Export a copy to move between devices.

## Run locally
From the repository root, run `python3 -m http.server 8000` and open http://localhost:8000/docs/. No install or build step is needed.

## Publish
In GitHub Settings → Pages select **Deploy from a branch**, **main**, **/docs**, then Save. Use the URL GitHub reports after deployment. Commit only source and synthetic examples. Download personal backups outside the repository.

## Edit
- docs/index.html contains the form, section order and labels.
- docs/style.css controls typography, spacing and mobile layout.
- docs/app.js handles rendering, editing, device storage and file import/export.
- docs/records.js validates the backup version, fields, dates, and grade states.
- docs/example.json contains two fictional records. Import it twice to check duplicate handling.

School dates use YYYY-MM-DD in Asia/Taipei, with no time of day. A graded zero is numeric. Missing, excused and ungraded entries have a null score. “Complete” tracks your work separately from its grade. Imported IDs preserve the original source label. Existing IDs always win, so use Edit for corrections. Import validates the entire file before saving. Clearing site data removes the log. Other apps hosted on the same origin share access to browser storage.

## Engineering journal · 9 November 2026
Justin proposed the project and chose GitHub Pages. Codex implemented this first release. Plain browser modules keep the site editable and publishable without a build. The original blueprint proposed React, TypeScript and SQLite. Revisit that stack when the planner or an authorized multi-device integration needs it.

The home screen opens on assignments. The key interaction is finding a due date and correcting an entry. Design reference: https://www.gov.uk/guidance/government-design-principles
Validation lives in a single module. Code review reference: https://google.github.io/eng-practices/review/reviewer/looking-for.html

## What comes next
Gather one verified course grading policy and a hand-calculated example before adding course averages. Alma ingestion depends on a permitted data source. Drive currently holds project documentation and release files. Automatic backup, scheduling and ChatGPT integration belong to later milestones.
