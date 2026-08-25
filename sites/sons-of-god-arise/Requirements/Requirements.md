# Requirements

Updated 2026-08-25 16:10 BST. This file is the requirement. The programs are not. Requirements only — no program changes from this file until you say.

Status

- **P** proposed
- **A** accepted
- **R** rejected
- **L** live
- **W** waiting to go to Live

Fields: date/time · status · site · requirement · criteria · result · installed date/time · tested ok

**tested ok** is for you. Leave blank until you check.

The check sheet is the current wording. Replaced old wordings are listed below.

**Replaced — do not test these old wordings**

- Footnote numbers next on the **whole page** → **#6** (per row).
- NEVER take backups → **#28** (Save backup when you click Save) and **#37** (Edit N after my edits).
- Test dies after 15 minutes idle → **#33** (Build and Test stay running).
- Hide Full Screen on tablets as well as phones → **#16** (phones only).
- Auto-wrap bible refs on Save → **#51** and **#52** (RHM New).
- Shrink header titles to one line → dropped (you said not worth more time).
- Footnotes column a fixed 10.5rem → **#10** (hug the longest ref).
- Page 1 row 2 is one column only → **#12** (photo in column 1). You added a second column.
- Photo menu on any column if you are not on a ref → **#45** (Photo format only, unless a bible ref is selected).
- Edit image only when a picture is already there → **#46** (Add / Remove / Edit settings).
- Separate right-click menus written per field → **#44** (one right-click, applied to columns and to the other fields on the website).

---

## Check sheet

Say yes or no on each. Number matches the detail below.

| # | status | requirement | tested ok |
|---|---|---|---|
| 1 | A | Save writes the column you edited (row id then column id) | |
| 2 | A | A popup on a ref survives Save | |
| 3 | A | Deleting a footnote number does not remove the popup | |
| 4 | A | An empty cell dump does not wipe a picture or real text | |
| 5 | A | Typing in a cell then Save does not replace the text with a locked old picture | |
| 6 | A | Footnote numbers run 1, 2, 3… **within each row** | |
| 7 | A | When numbers change in a row, the story numbers in that same row are mapped old→new, not find-replace | |
| 8 | A | Underline the ref only, not the footnote number | |
| 9 | A | The number sits beside the link, not inside it | |
| 10 | A | Footnotes column hugs the longest ref, no wrap, same size, grows with Settings only up to 16px | |
| 11 | A | Inserted picture: format Photo, fitted to the column | |
| 12 | A | Page 1 row 2 column 1 holds that garden photo, format Photo, fitted | |
| 13 | A | Beside a story, picture height matches the story | |
| 14 | A | Phone portrait: picture above the text | |
| 15 | A | Phone: Page Title sits between Prev and Next | |
| 16 | A | Full Screen hidden on phones only — not Mac, not tablets | |
| 17 | A | Prev / Next use line arrows | |
| 18 | A | Columns in a row are vertically centred | |
| 19 | A | Settings opens as an overlay, not a page section | |
| 20 | A | Footnotes tab shows or hides the footnotes column | |
| 21 | A | Settings tab follows the Contents tab format/size | |
| 22 | A | Click or tap a lookup (underlined ref) opens the verse | |
| 23 | A | Verse popup has no leftover format HTML (Heb 1:14 and any others) | |
| 24 | A | Save must not put that HTML junk back | |
| 25 | A | ESV bolds the same phrase as NKJV (inherit salvation) | |
| 26 | A | Mangled nested refs (Gen 1:27-28) stay clean: 1 Gen 1:27-28, 2 Isa 55:11 | |
| 27 | A | Footer says Updated | |
| 28 | A | When **you** click Save, a backup named Save goes in Back Up Versions/1 Builder | |
| 29 | A | Backup folder name is clock now, plus optional note; latest first | |
| 30 | A | Copy is the one selected site; destination site data is replaced | |
| 31 | A | I do not copy to Test, Live, or the web unless you say | |
| 32 | A | I do not start Live unless you click Live | |
| 33 | A | Build (8767) and Test (8768) stay running | |
| 34 | A | start-ew.command runs Builder/Test in Terminal without Grok | |
| 35 | A | Website icons are images/icon.jpg | |
| 36 | A | Builder Eternal Wellspring mark goes to index.html; that icon is never sent to :8766 | |
| 37 | A | After each of my program edits, stamp Edit N with a short description | |
| 38 | A | Restore can put **programs** back from a whole-Builder backup | |
| 39 | A | Click a row/col in Format: the allocated look is highlighted; new row/col/section starts as Default | |
| 40 | A | Column titles do not show on the page | |
| 41 | A | Stable id + order + editedAt; a copy always gets a new id | |
| 42 | A | Release status sits to the right of Release, blue ok / red error, same row as Copy Test to Live | |
| 43 | A | Do not rewrite scripture JSON to “fix” casing | |

### Editing Content

One right-click. Written once. Applied to columns and to the other fields on the website.

| # | status | requirement | tested ok |
|---|---|---|---|
| 44 | A | One right-click menu, written once, applied to columns and to the other fields on the website. Not written separately for each field. | |
| 45 | A | Photo menu opens only when the field format is Photo, and only if a bible ref is not selected | |
| 46 | A | Photo menu: Add a photo, Remove a photo, Edit the settings | |
| 47 | A | Add photo puts the picture in the field you right-clicked. Not another field. | |
| 48 | A | After Add / Remove / Edit settings, that menu closes | |
| 49 | A | Right-click **on a ref** opens Popups (New / Edit / Remove / Foot note) | |
| 50 | A | If text is selected, including refs: the menu has Bold, Italics, Underline, and font size | |
| 51 | A | Ticked footnotes field: right-click ref → New → next number in front of the book, then a space, then the ref | |
| 52 | A | Story field: New still makes a popup, **no** number | |
| 53 | A | Indent / Remove Indent for the selection | |
| 54 | A | Structure tree: Delete; add options under heading Add | |

---

## Details

### 1
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Save writes the column you edited. Look up the row (paragraph id) then that column id. Never by array index. Never last-wins find on column id alone.
- **criteria:** Edit one column, Save. That column keeps the change. Other columns with the same number-looking id do not change.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 2
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** A popup on a ref survives Save, including on a story column that is not the ticked footnotes column.
- **criteria:** Make a popup on a ref. Save. Click the same ref. The verse still opens.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 3
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Deleting a footnote number does not remove the popup.
- **criteria:** Delete only the number. Save. Click the ref. Verse still opens.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 4
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** An empty-looking dump from the editor must not wipe a picture or real text that was already in the column.
- **criteria:** A column with a picture or text does not go blank after Save if you did not delete it.
- **result:** In Builder programs. Page 1 row 2 still went blank once from an earlier Save; that wipe is why this rule exists.
- **installed date/time:** 2026-08-25
- **tested ok:**

### 5
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** If you type in a column and Save, the old picture must not come back over your text.
- **criteria:** Page 1 row 1 col 1: type, Save. Text stays. Adam and Eve picture does not replace it.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 6
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Footnote numbers are sequential within **each row**. A new number on the last row of the page is not 1 unless that row has no numbers yet.
- **criteria:** Two rows with footnotes. Each row starts at 1. New on row 2 after 1,2 gives 3 on row 2, not 1.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 7
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** When a row is renumbered, story numbers in **that same row** are mapped old→new. Not a find-replace across the page.
- **criteria:** Change order in one row. That row’s story numbers match. Other rows unchanged.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 8
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** The footnote number is not underlined. Only the ref is underlined.
- **criteria:** Look at 1 Gen 1:27-28. 1 is not underlined. Gen 1:27-28 is.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-25
- **tested ok:**

### 9
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** The number sits beside the link, not inside the link.
- **criteria:** The number is not part of the blue underlined ref.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-25
- **tested ok:**

### 10
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Footnotes column: wide enough for the longest bible ref, no wrap, all refs the same size, as small as necessary, consistent. Font may grow with Settings only up to 16px.
- **criteria:** Longest ref on one line. Column not huge. Zoom in Settings: refs grow, stop at 16px.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 11
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** An inserted picture uses format Photo and fits the column (width of the column, height follows the picture).
- **criteria:** After insert, Format shows Photo. Picture fills the column width and is not cropped unless you chose Crop.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-25
- **tested ok:**

### 12
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Page 1 row 2 column 1 shows that garden photo, format Photo, fitted to the column.
- **criteria:** Open page 1 Home. Row 2 column 1 is the garden picture, not blank, not the word test.
- **result:** Written to disk then later disk showed test again from your Builder session. You still need to see this yourself.
- **installed date/time:** 2026-08-25
- **tested ok:**

### 13
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Where a picture sits beside a story, the picture height matches the story.
- **criteria:** Page 2 rows with a picture and story: picture height matches the story block.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 14
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** On a phone in portrait, the picture sits above the text.
- **criteria:** Phone portrait. Picture first, story under it.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 15
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** On a phone, Page Title sits between Prev and Next. It is not called anything else.
- **criteria:** Phone. Title bar: Prev · Page Title · Next.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 16
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Full Screen is hidden on phones only. Mac and tablets keep Full Screen.
- **criteria:** iPhone: no Full Screen. iPad and Mac: Full Screen still there.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 17
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Prev and Next use line arrows.
- **criteria:** The arrow is a line chevron, not a filled triangle blob.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 18
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Columns in a row are vertically centred.
- **criteria:** Picture beside shorter/taller story: both sit centred on the row.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 19
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Settings opens as an overlay popup, not as a page section.
- **criteria:** Click Settings. Overlay on top of the page. Page content still there behind it.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 20
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Footnotes tab shows or hides the footnotes column.
- **criteria:** Footnotes tab on: refs column visible. Off: hidden on the live page. Still visible while editing.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 21
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** The Settings tab follows the Contents tab format and size.
- **criteria:** Change Contents tab look. Settings tab matches.
- **result:** In Builder programs. Later listed as still to confirm on the Test program base.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 22
- **date/time:** 2026-08-17
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** A lookup is words on the page that open something behind them — often a verse, or a short note. Underlined words are lookups. A single click or tap opens the Word next to the story.
- **criteria:** Click or tap Rom 8:19-21 (or any blue underlined lookup). The verse opens. Ordinary bold or underline that is not a lookup does not open a verse.
- **result:** This is your published requirement (Website hierarchy + site description). Not taken from the programs.
- **installed date/time:**
- **tested ok:**

### 23
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Verse popup text has no leftover format HTML. Heb 1:14 and any other verse with that junk are cleaned. Master is checked.
- **criteria:** Open Heb 1:14. You see the verse, not div/span/font-size junk after it.
- **result:** Site scriptures cleaned. Sanitizer in the program. Can come back if a dirty save is not stripped — see 24.
- **installed date/time:** 2026-08-25
- **tested ok:**

### 24
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Save must strip that format HTML, not escape it into the scripture.
- **criteria:** Open a verse, Save. Heb 1:14 still clean.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-25
- **tested ok:**

### 25
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** ESV bolds the same phrase as NKJV when the words are the same (inherit salvation).
- **criteria:** Open that verse in ESV. inherit salvation is bold.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 26
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Footnote refs must not nest inside themselves. Page 2 row with Gen 1:27-28 reads 1 Gen 1:27-28 and 2 Isa 55:11, matching the story numbers.
- **criteria:** That footnotes column shows two clean lines, not 1 1 Gen… inside a broken link.
- **result:** Data cleaned. Save no longer nests those links.
- **installed date/time:** 2026-08-25
- **tested ok:**

### 27
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** Footer label is Updated, not Date Updated.
- **criteria:** Builder home footer: Updated:
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 28
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** When **you** click Save, a backup named Save is written in the normal folder Back Up Versions/1 Builder.
- **criteria:** Click Save. A new folder appears, name includes Save.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 29
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** Backup name is clock now (plus optional note). List latest first. Not the site Updated stamp.
- **criteria:** Take a backup. Folder time matches now. It sits at the top.
- **result:** In Builder programs. date-updated on the site can still make some stamps look like 26-08-24 23-14; the note makes them unique.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 30
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** Copy to Test / Copy Test to Live copies the one selected site. Destination site data is deleted then replaced, so deletions in the source disappear at the destination.
- **criteria:** Copy one site. Only that site moves. Removed pages are gone at the destination.
- **result:** In Builder programs. I must not run these unless you say (#31).
- **installed date/time:** 2026-08-24
- **tested ok:**

### 31
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** I do not copy to Test, do not copy to Live, do not copy to the web, do not git-push, unless you say.
- **criteria:** Those buttons and the web only change when you tell me to.
- **result:** Standing. A GitHub push was done once; you forbade any further.
- **installed date/time:**
- **tested ok:**

### 32
- **date/time:** 2026-08-23
- **status:** A
- **site:** Website Builder
- **requirement:** I do not start Live unless you click Live.
- **criteria:** Live (8766) is not started by me on my own.
- **result:** Standing.
- **installed date/time:**
- **tested ok:**

### 33
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** Build and Test stay running. Test does not die after 15 minutes idle.
- **criteria:** 8767 and 8768 still answer after idle. Live is separate.
- **result:** In Builder programs. I restart Test if it dies.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 34
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** A script you run in Terminal operates Eternal Wellspring without Grok: start-ew.command. Starts Builder (and Test with it). Does not start Live. Open http://127.0.0.1:8767/. Ctrl+C stops.
- **criteria:** Double-click start-ew.command. Builder opens. Live does not start.
- **result:** File is at Eternal Wellspring/start-ew.command.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 35
- **date/time:** 2026-08-23
- **status:** A
- **site:** Website Builder
- **requirement:** Website icons use images/icon.jpg in that website’s images folder. I do not rename your files.
- **criteria:** Each site icon is that file.
- **result:** Standing.
- **installed date/time:** 2026-08-23
- **tested ok:**

### 36
- **date/time:** 2026-08-23
- **status:** A
- **site:** Website Builder
- **requirement:** In Builder, the Eternal Wellspring mark goes to index.html. That Builder icon is never sent to :8766. Live on the web must not send people to :8766.
- **criteria:** Click the mark in Builder: local Builder home. Live www: no :8766.
- **result:** Standing.
- **installed date/time:** 2026-08-23
- **tested ok:**

### 37
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** After each of my program edits, stamp Edit N with a short description in Back Up Versions/1 Builder.
- **criteria:** After I change programs, a new Edit N folder exists.
- **result:** Edit 1–10 were stamped. I will keep doing this.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 38
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** Restore can put programs back from a whole-Builder backup (programs tick).
- **criteria:** Restore Builder programs from a named backup. Programs match that backup. Site data only if you say.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 39
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Click a row or column in Format: the allocated look is highlighted. A new row, column, or section starts as Default.
- **criteria:** Click a Photo column: Photo is highlighted. Add a new column: Default.
- **result:** Was on the one-at-a-time list. Confirm on this Test program base.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 40
- **date/time:** 2026-08-23
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Column titles do not appear on the page.
- **criteria:** No column title line above column text on the live page.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-23
- **tested ok:**

### 41
- **date/time:** 2026-08-23
- **status:** A
- **site:** Website Builder
- **requirement:** Every row and column has a stable id, an order, and an editedAt. Copying always makes a new id. An edit whose time is not after the stored last edit is rejected.
- **criteria:** Duplicate a row: new id. Stale overwrite does not win.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-23
- **tested ok:**

### 42
- **date/time:** 2026-08-24
- **status:** A
- **site:** Website Builder
- **requirement:** Release status sits to the right of Release, blue if ok, red if error, on the same row as Copy Test to Live. Do not say Live is the web unless the push finished.
- **criteria:** Click Release. Note appears on that row, colour matches success or failure.
- **result:** In Builder programs.
- **installed date/time:** 2026-08-24
- **tested ok:**

### 43
- **date/time:** 2026-08-23
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Do not rewrite scripture JSON to “fix” casing of book names.
- **criteria:** Eph stays Eph if that is what is stored. I do not bulk-change casing.
- **result:** Standing.
- **installed date/time:**
- **tested ok:**

### Editing Content

### 44
- **date/time:** 2026-08-25 16:10 BST
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** One right-click menu. Written once. Applied to columns and to the other fields on the website. Not written separately for each field.
- **criteria:** Right-click a column, Page Title, tagline, heading, tab, or other field. Same menu system. Same rules. Not a different menu built for each place.
- **result:**
- **installed date/time:**
- **tested ok:**

### 45
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** The photo menu opens only when the field format is Photo. Only then, unless a bible ref is selected. If a bible ref is selected, Popups opens instead (#49). If text is selected, including refs, also #50.
- **criteria:** Format Photo, no text selected, right-click: photo menu (Add / Remove / Edit settings). Format not Photo: no photo menu. Photo field with a bible ref selected: Popups, not photo menu. Text selected, including refs: Bold, Italics, Underline, font size (#50). Same on columns and on the other fields on the website.
- **result:**
- **installed date/time:**
- **tested ok:**

### 46
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** The photo menu has Add a photo, Remove a photo, and Edit the settings.
- **criteria:** Right-click a Photo-format field with no ref selected. Those three are on the menu.
- **result:**
- **installed date/time:**
- **tested ok:**

### 47
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Add photo puts the picture in the field you right-clicked. Not another field.
- **criteria:** Photo-format field. Add a photo. It appears in that field only.
- **result:**
- **installed date/time:**
- **tested ok:**

### 48
- **date/time:** 2026-08-25
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** After Add photo, Remove photo, or Edit settings, the photo menu closes.
- **criteria:** Use one of those three. The menu is gone.
- **result:**
- **installed date/time:**
- **tested ok:**

### 49
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Right-click **on a bible ref** opens Popups: New, Edit, Remove, Foot note.
- **criteria:** Right-click the blue ref Rom 8:19-21. You get Popups, not the photo menu. Same on columns and on the other fields on the website.
- **result:**
- **installed date/time:**
- **tested ok:**

### 50
- **date/time:** 2026-08-25 16:02 BST
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** If text is selected, including refs, the menu has Bold, Italics, Underline, and font size.
- **criteria:** Select text (plain text or a ref). Right-click. Bold, Italics, Underline, and font size are on the menu. Same on columns and on the other fields on the website.
- **result:**
- **installed date/time:**
- **tested ok:**

### 51
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** On the ticked footnotes field, right-click a ref → New. The next footnote number goes in front of the book name, then a space, then the ref, then the popup.
- **criteria:** New on the last ref of a row that already has 1 and 2. You get **3** Book chapter:verse, not 1, and not glued as 3Gen.
- **result:**
- **installed date/time:**
- **tested ok:**

### 52
- **date/time:** 2026-08-24
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Right-click New on a story field still makes a popup. It does not add a footnote number.
- **criteria:** New on Rom 8:19-21 in the story. Popup opens. No number appears in front.
- **result:**
- **installed date/time:**
- **tested ok:**

### 53
- **date/time:** 2026-08-23
- **status:** A
- **site:** sons-of-god-arise
- **requirement:** Indent / Remove Indent applies to the cursor or selection.
- **criteria:** Select a paragraph bit, Indent. It indents. Remove Indent takes it back. Same on columns and on the other fields on the website where text can indent.
- **result:**
- **installed date/time:**
- **tested ok:**

### 54
- **date/time:** 2026-08-23
- **status:** A
- **site:** Website Builder
- **requirement:** Right-click in the structure tree: Delete. The add options sit under a heading Add.
- **criteria:** Right-click in the structure tree. Add heading, then Page/Section/…, and Delete.
- **result:**
- **installed date/time:**
- **tested ok:**
