# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at `src/app/page.tsx`.

## Configuration

This application requires a Google Sheets API key and configuration for the event sheets. Follow these steps to set it up:

### 1. Set up Google Cloud Project and API Key

1.  **Go to the Google Cloud Console:** [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a new project** or select an existing one.
3.  **Enable the Google Sheets API:**
    *   In the Google Cloud Console, navigate to "APIs & Services" > "Library".
    *   Search for "Google Sheets API".
    *   Select it and click "Enable" for your project.
4.  **Create an API Key:**
    *   Navigate to "APIs & Services" > "Credentials".
    *   Click "+ CREATE CREDENTIALS" at the top of the page, then select "API key".
    *   Your API key will be created. Copy it immediately and keep it secure.
5.  **Restrict your API Key (Highly Recommended for security):**
    *   In the API key list on the "Credentials" page, find your newly created key and click the pencil icon (Edit API key).
    *   Under "API restrictions":
        *   Select "Restrict key".
        *   In the "Select APIs" dropdown, choose "Google Sheets API".
        *   Click "OK".
    *   Click "Save".
    *   *Note: This project uses the API key for server-side requests, so application restrictions like HTTP referrers are not typically needed. If you require more fine-grained access control (e.g., for private sheets), consider using OAuth 2.0 with a service account, though this project is currently set up for simple API Key access to public/shared sheets.*

### 2. Prepare your Google Sheet(s)

For the application to read data using an API key, your Google Sheet(s) must be accessible.
1.  Open your Google Sheet.
2.  Click the "Share" button (usually in the top-right corner).
3.  Under "General access":
    *   If it says "Restricted", click it and change to "Anyone with the link".
    *   Ensure the role selected is "Viewer".
4.  Click "Done".
Repeat for all Google Sheets you intend to use.

### 3. Configure Environment Variables

The application loads configuration from environment variables.
1.  In the root directory of this project, create a file named `.env.local`.
    You can do this by copying the example file:
    ```bash
    cp .env.local.example .env.local
    ```
2.  Open the `.env.local` file in a text editor.
3.  Set your Google Sheets API key:
    ```env
    GOOGLE_SHEETS_API_KEY="YOUR_COPIED_API_KEY_FROM_STEP_1"
    ```
    Replace `YOUR_COPIED_API_KEY_FROM_STEP_1` with the actual API key you obtained from the Google Cloud Console.
4.  Configure Google Sheet IDs and Event Labels:
    *   `GOOGLE_SHEET_IDS`: A comma-separated list of your Google Sheet IDs.
        The Sheet ID is the long string of characters in the URL of your Google Sheet. For example, if your sheet URL is `https://docs.google.com/spreadsheets/d/1pGxxsHBNylzDsHuJDLaHpMO2lOv2ZSWB4OQYG98J8AY/edit#gid=0`, the Sheet ID is `1pGxxsHBNylzDsHuJDLaHpMO2lOv2ZSWB4OQYG98J8AY`.
    *   `GOOGLE_SHEET_EVENT_LABELS`: A comma-separated list of display names for your events. These labels will appear in the event selection dropdown in the application.

    **Important:** The order of Sheet IDs in `GOOGLE_SHEET_IDS` must correspond exactly to the order of labels in `GOOGLE_SHEET_EVENT_LABELS`. There must be an equal number of IDs and labels.

    Example:
    ```env
    GOOGLE_SHEET_IDS="sheet_id_1,sheet_id_2,sheet_id_3"
    GOOGLE_SHEET_EVENT_LABELS="Event Alpha 2023,Event Beta 2024,Event Gamma 2025"
    ```

### 4. Google Sheet Format Requirements

For the application to correctly parse the data, your Google Sheet should adhere to the following format:
*   **Header Row:** The first row of your sheet must be a header row.
*   **Required Columns:** Column names are case-insensitive and will be trimmed of leading/trailing whitespace. The sheet must contain columns with headers matching (or closely matching) these names:
    *   `Name` (for athlete's name)
    *   `Bib Number` (for athlete's bib number)
    *   `Ticket Name` (for the type of ticket or registration)
*   **Optional Searchable Columns:** The application also searches these columns if present:
    *   `Phone`
    *   `Email`
*   **Data Rows:** Subsequent rows should contain the data for each athlete corresponding to the header columns.

If required columns (`Name`, `Bib Number`, `Ticket Name`) are missing from the headers, a warning will be logged in the server console, and "N/A" might be displayed for those fields in the search results.

After completing these steps, restart your development server (`npm run dev`) for the changes to take effect.
