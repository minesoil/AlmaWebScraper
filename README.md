# Compass
I use Compass to keep my assignments, deadlines and individual scores in one place. I edit in one browser tab and export a JSON backup when I want to move my records to another device.

## How I run it
I run `python3 -m http.server 8000` from the repository root and open http://localhost:8000/docs/. I can edit the site without installing dependencies or running a build.

## How I publish it
In GitHub Settings → Pages, I choose **Deploy from a branch**, select **main** and **/docs**, and save. I use the URL GitHub provides after deployment. I keep my personal backups outside this repository and commit only source files and fictional examples.

## Where I make changes
- I edit the form and its labels in `docs/index.html`.
- I adjust typography, spacing and mobile layout in `docs/style.css`.
- I edit the assignment list, browser storage and import/export behavior in `docs/app.js`.
- I change record validation in `docs/records.js`.
- I can import `docs/example.json` twice to check how Compass handles duplicate IDs.

I enter school dates as YYYY-MM-DD in Taipei local time. I can record a graded zero. For missing, excused or ungraded work, I leave the score empty. I mark work complete separately from its grade.

When I import a backup, Compass checks every record before saving and preserves the source label. If an ID already exists, I keep the current entry and use Edit to correct it. I export before clearing site data because that would erase my log. Other apps on the same origin can access this browser storage.

## My engineering journal · 9 November 2026
I proposed Compass and chose GitHub Pages. I can edit the first release as plain browser modules. My original blueprint considered React, TypeScript and SQLite. I can revisit those choices when I need a planner or multi-device access.

I want to find a due date or correct a score as soon as I open the dashboard. That’s why my assignments appear first. I keep validation in one module so I can follow what happens to a record before it’s saved.

Design reference: https://www.gov.uk/guidance/government-design-principles
Code review reference: https://google.github.io/eng-practices/review/reviewer/looking-for.html

## What I’ll do next
I’ll verify one course grading policy and work through an example by hand before adding course averages. I’ll need a permitted data source for Alma. For now I keep documentation and release files in Drive. I’ve left automatic backups, scheduling and a study assistant for later milestones.
