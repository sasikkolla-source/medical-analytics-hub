# Medical Analytics Hub

A simple hospital analytics dashboard (plain HTML, CSS and JavaScript).

## Run
Open `index.html` in any browser. No installation or server needed.

## Files
- `index.html` - page structure
- `style.css` - layout, colours, light/dark themes
- `app.js` - sample data, charts, filters, sortable patient table

## Use your own data
In `app.js`, replace `makeData()` so it returns records shaped like:
`{id, name, age, dept, dx, month (0-11), los (days), cost, out ("Recovered"|"Readmitted"|"Critical")}`
