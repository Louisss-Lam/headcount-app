# Scottish Power Daily Headcount Tracking App - Email Thread

## Adam Kirk - Initial Idea
**Thu, Feb 26, 3:08 PM**
*To: Louis, Thomas, Jason, Pete*

Hi Louis,

One of our challenges is tracking our daily headcount.

I've had an idea, let me explain and you can tell me if this is possible?

Managers are given access to a Headcount App.

Each morning, we load in a simple excel sheet:
- Agent Full Names
- Manager Full Name

The manager then receives a Push Notification on their mobile device:

> "It's time to organise your headcount!"

Manager then clicks to open the App.

They are then presented with a screen displaying all of their agents as random Animated MiMoji's (I'm thinking similar to the Nintendo Wii Mii Plaza - if you remember that!)

Manager then drags their agents, one by one, into the relevant pot:
- Active
- Not in
- Sick
- Holiday
- Leaver

Once the task is complete, they then click 'Submit.'

This then sends an excel export to a designated email address - ideally all submissions will come through as one daily email.

Let me know your thoughts.

**Adam Kirk** - Account Manager
Energy Services | DWM Energy Services
07785621950 | adam.kirk@dwmas.co.uk
2nd Floor, 3-5 St Paul's Square, Birmingham, B3 1QU

---

## Louis Lam - Response
**Fri, Feb 27, 11:30 AM**
*To: Adam, Thomas, Jason, Pete*

Hi Adam,

Love this idea, definitely possible. The drag-and-drop concept with the Mii-style avatars is a nice touch, should make it feel less like a chore for the managers.

Let me put something together and I'll have a demo ready for you by next Friday so you can see if it meets your expectations. Many thanks.

**Louis Lam** - Head of Marketing & Development
3-5 St Paul's Square (Top Floor), Birmingham, B3 1QU
louis.lam@dwmas.co.uk

---

## Adam Kirk - Confirmation
**Fri, Feb 27, 11:38 AM**
*To: Louis, Thomas, Jason, Pete*

That sounds good! Thanks, Louis. If you need anything please let me know.

---

## Louis Lam - Demo Ready
**Thu, Mar 5, 3:48 PM**
*To: Adam, Thomas, Jason, Pete*

Hi Adam,

Hope you're well. The headcount app is ready for you to have a play with. Here's how it works and what to test.

**App URL:** https://main.d35bei23phx7yk.amplifyapp.com
**Password:** DWM2026!!

### How It Works (Daily Workflow)

1. You upload the Excel roster (same format - agent names, manager names, manager emails). This can be done once each morning.
2. You see a preview table showing each manager, their email, and how many agents they have. No emails go out yet - this gives you a chance to check everything looks right.
3. You click "Send All Links" when you're happy. Each manager gets an email with a personal link to open their headcount page.
4. Managers click their link, see their agents as avatars, drag them into categories (Active, Not In, Sick, Holiday, Leaver), and hit Submit. An Excel report gets emailed out.
5. If a manager didn't get their email or needs a new link, you can click "Re-send" next to their name - no need to re-upload or bother the other managers.

### What to Test

- Upload the roster (attached) and check the preview table looks correct
- Click "Send All Links" and confirm the emails arrive
- Try the "Re-send" button on one manager
- Open a manager's email link and go through the headcount (drag agents, submit)
- Try opening a link with a wrong token (change a few characters in the URL) - it should show a clear error message

### The Plan

For now this runs as a web app - managers just open the link from their email, no install needed. If everything runs smoothly and you're happy with it, the next phase would be to wrap it into a proper mobile app with push notifications and all that. One step at a time!

Feel free to share your thoughts - nothing is set in stone and happy to adjust anything. Many thanks.

---

## Thomas Pearson - Login Issue
**Fri, Mar 6, 8:20 AM**
*To: Louis, Adam, Jason, Pete*

Hey Louis,

Is the password correct? I'm getting no response when trying to login.

Thanks,

**Thomas Pearson** - CEO
3-5 St Paul's Square (Top Floor), Birmingham, B3 1QU
thomas.pearson@dwmas.co.uk

---

## Louis Lam - Fix Confirmed
**Fri, Mar 6, 9:05 AM**
*To: Thomas, Adam, Jason, Pete*

Hi Tom,

Apologies for the trouble logging in earlier, the issue is now fixed and everything should be working.

In short, the app's security settings were a bit too strict, which meant your browser was silently rejecting the login when you clicked your link. It worked fine on our end during testing but behaved differently on other devices.

Please try your link again and let me know if you have any issues.

Sorry for the inconvenience!

---

## Adam Kirk - Feedback & Requests
**Fri, Mar 6, 12:18 PM**
*To: Louis, Thomas, Jason, Pete*

Thank you for this, Louis. I've given it a test run..

I submitted a test-roster and sent it to myself so that I could test it as a user.

It is really simple and user friendly (exactly what it needs to be!)

I've had Pav test it too, he likes it.

It gives us much tighter daily control over attendance, which is exactly what we need.

Just a couple of asks:

1. **Hidden mailing list** - Instead of Managers entering an email address for submission, is it possible to hide a mailing list behind the 'submit' button?
   - For now, those addresses are adam.kirk@dwmas.co.uk & benjamin.shuttleworth@dwmas.co.uk (may add more)

2. **Centralised submissions via Google Sheet** - Can the submissions be centralised instead of sent as individual sheets? Perhaps they could be linked to a Google Sheet?

3. **Date column** - Could you also add the date of the submission as a column please? This would allow us to easily filter by day, week, month to see, at the manager level, their active percentage, their number of leavers, etc.

4. **Happy avatars** - Some of the MiMoji's look a little sad or ill, can they all be happy please?

Again, thanks Louis! The concept is exactly what I'm looking for.

---

## Louis Lam - Plan for Updates
**Mon, Mar 9, 11:08 AM**
*To: Adam, Thomas, Jason, Pete*

Hi Adam,

Thanks for the great feedback, really glad it's hitting the mark for you and Pav!

No problem at all on those changes. Quick summary:

- **Hidden mailing list** - will remove the email field from the manager's view and hardcode the distribution list (you + Benjamin) behind the submit button. Easy done.
- **Happy avatars** - haha, fair point! Will make sure they're all smiling.
- **Centralised submissions via Google Sheets** - love this idea. Instead of individual emails, every submission will append directly to a shared Google Sheet with the date column included. This way you can filter by day, week, month, track active %, leavers, etc. all in one place.

For the Google Sheets bit, I just need a couple of things from your side:

**Step by step:**
1. Create a new Google Sheet, just a blank one, you can name it something like "DWM Headcount Tracker"
2. Share it with this email address (this is our system's service account, not a real person): headcount@dwm-login-415616.iam.gserviceaccount.com
3. When sharing, make sure to set the permission to Editor
4. Send me the link to the sheet

That's it from your end, I'll handle the rest and set up the column headers automatically.

I'll get the happy avatars and hidden mailing list done first, then plug in the Google Sheet once you've shared it across. Many thanks.

---

## Louis Lam - Follow Up
**Mon, Mar 23, 10:59 AM**
*To: Liam, Adam, Thomas, Jason, Pete*

Hi Adam,

Just checking in on the Headcount App. Did you get a chance to set up the Google Sheet and share it with the service account? Once that's done I can get the updates pushed through.

Let me know if you need any help with it. Many thanks.

---

## Adam Kirk - Google Sheet Shared
**Tue, Mar 25, 11:57 AM**
*To: Louis, Thomas, Jason, Pete, Liam*

Hi Louis,

Thanks for chasing, this had slipped my mind!

Here is the link to the sheet:
https://docs.google.com/spreadsheets/d/10bRIt7vdK9dTwkAtyOCS-ce7M9rSS3W5NeDLslY6EL0/edit?usp=sharing

I have shared it with the email you provided and granted editorial permissions.

Thanks Adam

---

## Louis Lam - Requesting Access
**Wed, Mar 26, 2026**
*To: Adam, Thomas, Jason, Pete, Liam*

Hi Adam,

Thanks for sharing the Google Sheet. I've just tried to access it but I don't seem to have permission yet - it's showing a "You need access" page.

Could you share the sheet with my email address as well and set the permission to Editor?

`louis.lam@dwmas.co.uk`

The service account (`headcount@dwm-login-415616.iam.gserviceaccount.com`) will also need Editor access for the app to write to it, so if you could make sure both have access that would be great.

Let me know if you have any issues. Many thanks.
