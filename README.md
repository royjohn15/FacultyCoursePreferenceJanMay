# Faculty Course Preference — Jan–May 2027

A form where faculty pick 5 course preferences and 3 lab preferences, with no duplicates and no blank fields. It also collects their name, email ID and optional remarks. Before submitting, they see a preview to confirm. Each submission is saved to a Google Sheet and a confirmation email is sent to the faculty member.

| File | Purpose |
|---|---|
| `index.html` | The form. Hosted on GitHub Pages. |
| `Code.gs` | Google Apps Script backend. Saves to the Sheet and sends the email. |
| `update_courses.py` | Rebuilds the course and lab lists in `index.html` from the xlsx. |

## 1. Connect the Google Sheet (one time)

1. Create a new Google Sheet, e.g. *Faculty Course Preference Jan–May 2027*.
2. In the Sheet, open **Extensions → Apps Script**.
3. Delete the starter code, paste in all of `Code.gs`, and save.
4. Click **Deploy → New deployment**. Click the gear icon, choose **Web app**, and set:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
5. Click **Deploy** and **Authorize access**. When Google shows "unsafe app", click *Advanced → Go to … (unsafe)*. The script is yours, so this is safe to allow.
6. Copy the **Web app URL**. It ends in `/exec`.
7. In `index.html`, replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.

To check it's working, open the `/exec` URL in a browser. You should see
`{"ok":true,"message":"Faculty Course Preference backend is running."}`.

Submissions go to a **Responses** tab, which is created automatically on the first submission. The **Email Sent** column says `Yes` or `FAILED` for each row.

> If you edit `Code.gs` later, go to **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**.
> This keeps the same URL. Choosing *New deployment* instead creates a new URL, and you'd have to update `index.html` again.

**Email limit:** a regular Gmail account can send about **100 emails per day** through Apps Script. A Google Workspace (institute) account can send about 1,500. If the limit is reached, the submission is still saved and the row is marked `FAILED`.

## 2. Host on GitHub Pages

1. Create a new repository on GitHub, e.g. `faculty-course-preference`.
2. Push this folder to it:
   ```bash
   git remote add origin git@github.com:<your-username>/faculty-course-preference.git
   git push -u origin main
   ```
3. On GitHub, open the repository's **Settings → Pages**. Set *Source* to **Deploy from a branch**, choose **main** and **/ (root)**, and click Save.
4. After about a minute the form is live at `https://<your-username>.github.io/faculty-course-preference/`.

## Updating the course list

If you get a new xlsx (same layout: `CourseNo`, `CourseName` in columns A–B), run:

```bash
python3 update_courses.py "new-file.xlsx"
```

Any course whose name contains the word "Lab" or "Laboratory" goes in the lab list. PH5250 (Advanced Electronics & Lab) is the exception and stays a course; you can change this with `NOT_LABS` in the script. Commit and push afterwards.
