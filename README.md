# Erskine Park Visitor Sign-In System (VSS)

A Progressive Web App for managing visitor sign-ins at the Erskine Park facility.

**Production URL:** https://adapt.myigt.com/apps/vss/  
**Azure Static Web Apps:** https://icy-bay-0a8096410.7.azurestaticapps.net  
**GitHub Pages:** https://igtopsapac.github.io/visitorsignin/

---

## Features

- Visitor sign-in with returning visitor detection and pre-fill
- Configurable form fields (Admin → Sign-in form fields)
- Host notification via **Microsoft Teams** webhook
- Host notification via **email** (Power Automate / Office 365 Outlook)
- Admin panel with PIN + Face ID / fingerprint (WebAuthn)
- Auto sign-off at 6:00 PM with log note
- Visitor log with search, filter, and CSV export
- Employee CSV import (Name, Email, Department, TeamsWebhook columns)

---

## Repository structure

```
/
├── index.html              ← The entire PWA (single file)
├── Dockerfile              ← nginx container, serves at /apps/vss/
├── nginx.conf              ← nginx config, listens on port 3006
├── docker-compose.yml      ← ADAPT VPS compose (joins adapt-web network)
├── .gitignore
├── README.md
└── deploy/
    ├── vss.caddy           ← Caddy route file (copy to ADAPT on first deploy)
    ├── deploy.ps1          ← PowerShell: full first-time deployment
    └── update.ps1          ← PowerShell: routine update after git push
```

---

## Deploying to ADAPT VPS

### First-time deployment

```powershell
# From your local machine (PowerShell):
.\deploy\deploy.ps1 -VpsUser yourADusername -InstallCaddy
```

This will:
1. Check disk space and adapt-web network
2. Clone the repo to `/opt/VSS` on the VPS
3. Build the Docker container and start it
4. Run a local health check
5. Install the Caddy route and reload the proxy
6. Verify the public URL

### Routine updates (after pushing changes to GitHub)

```powershell
.\deploy\update.ps1 -VpsUser yourADusername
```

This pulls the latest code, rebuilds the container, and verifies the health check.

### Manual SSH commands (if needed)

```bash
# SSH into the VPS
ssh yourusername@AUSWEBADA01P

# Update and rebuild
cd /opt/VSS
git pull
sudo docker compose up -d --build
sudo docker compose ps

# Health check
curl http://127.0.0.1:3006/apps/vss/health

# View logs
sudo docker compose logs -f --tail=50
```

---

## Admin panel

- **Default PIN:** `1234` — change immediately after first login
- **Face ID / fingerprint:** enrol once per device in Admin → Change admin PIN → Face ID section
- **Employee import:** CSV with columns `Name,Email,Department,TeamsWebhook`
- **Teams webhook:** per-employee, set in Admin → Teams notifications
- **Email webhook:** single Power Automate URL, set in Admin → Email notifications

### Setting up email notifications (Power Automate)

1. In Microsoft Teams, create a flow from **Workflows** → "Send webhook alerts to a channel"
2. Remove the "Post card in a chat or channel" action
3. Add **Data Operations → Compose**, rename to "Decode VSS event"
   - Expression: `json(base64ToString(triggerBody()?['sections']?[0]?['text']))`
4. Add **Office 365 Outlook → Send an email (V2)**
   - To: `outputs('Decode_VSS_event')?['email']?['toLine']`
   - Subject: `outputs('Decode_VSS_event')?['email']?['subject']`
   - Body: `outputs('Decode_VSS_event')?['email']?['html']`
5. Copy the webhook URL from the flow trigger
6. Paste into Admin → Email notifications → Save

---

## VPS deployment info

| Field | Value |
|---|---|
| Slug | `vss` |
| Directory | `/opt/VSS` |
| Service name | `vss-frontend` |
| Internal port | `3006` |
| Public route | `/apps/vss/` |
| Caddy file | `deploy/projects/vss.caddy` |
| Network | `adapt-web` (external, owned by ADAPT stack) |

---

## APAC SC Operational Excellence

Maintained by the APAC Manufacturing Operations team, Erskine Park.
