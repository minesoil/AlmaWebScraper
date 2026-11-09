# Compass
A coursework dashboard for assignments, deadlines and individual scores. Records are saved in browser storage on the current device. Export a JSON backup before switching devices or clearing site data.

## Run locally
Run `python3 -m http.server 8000` from the repository root, then open http://localhost:8000/docs/. No build step is required.

## Publish
In Settings → Pages, choose **Deploy from a branch**, **main**, and **/docs**. If Pages publishes the repository root, the root index redirects to the dashboard.

## Available tools
- Filter by course or completion status, search assignments, and find overdue work.
- Review open, overdue and completed counts across all courses.
- See each course’s open work, number of graded records and recorded score range.
- Add and correct assignments, mark work complete, reopen it or confirm deletion.
- Export JSON and import a backup. Existing IDs keep their current records.

The course overview reports individual scores. A course average requires a verified grading policy. Overdue means an unfinished assignment whose due date is earlier than today in Asia/Taipei. Work due today stays open.

## Editing
| File | Purpose |
| --- | --- |
| docs/index.html | Form and section layout |
| docs/style.css | Typography and responsive layout |
| docs/app.js | Rendering, controls, storage and imports |
| docs/records.js | Validation, date handling, filters and summaries |
| docs/example.json | Fictional records for trying imports |

Graded zeros remain numeric. Missing, excused and ungraded work have null scores. Completion is independent of grade status. The backup format remains version 1, so earlier exports remain usable. Keep personal backups outside this public repository. Edit from one tab at a time.

## Engineering journal · 9 November 2026
I proposed Compass and chose GitHub Pages so I could edit and publish a small static site. I initially considered React and SQLite. Plain browser modules are enough for the current coursework log.

I reduced repeated first-person wording in labels and status messages. I kept first person in this journal to describe project decisions.

The latest checks cover Taipei midnight, overdue boundaries, combined course/search filters, graded zeros and exclusion of ungraded records from score ranges. Browser interaction checks are still pending.

## Next milestone
I’ll verify one course grading policy and work through a sample by hand before adding course averages. I’ll establish a permitted data source before implementing Alma ingestion.

Design reference — https://www.gov.uk/guidance/government-design-principles
Code review reference — https://google.github.io/eng-practices/review/reviewer/looking-for.html

## Homework update
I chose homework organization as the main job, a compact layout, and suggestions I can adjust.

The default list shows open assignments. Due today follows the Taipei calendar. Next 7 days includes today and the following six dates. Course scores are under a collapsible section.

Each assignment can include estimated minutes and a concrete first step. Older records stay usable and show no estimate until edited. These fields travel with JSON backups.

“What fits now?” accepts 1–480 minutes. Suggestions consider unfinished assignments with estimates, ordered by due date, then shorter estimates and stable IDs. The selection includes each whole assignment that fits the remaining time. An earlier long assignment may be skipped when it cannot fit. Checkboxes allow manual changes, with an over-budget message when needed. Selections are temporary and can be regenerated after a reload.

Checks covered previous backup records, invalid estimates, completed work, missing estimates, deadline order, daily and weekly boundaries, and budget limits from 1–90 minutes. Full browser testing remains pending. The time estimates are user-entered. Learning from actual session durations is a future experiment.
