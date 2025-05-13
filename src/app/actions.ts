
"use server";

export interface AthleteInfo {
  bibNumber: string;
  name: string;
  ticketName: string;
}

export interface SearchResult {
  data?: AthleteInfo[];
  error?: string;
}

export interface EventForClient {
  value: string; // Index of the event as a string
  label: string;
}

export interface EventListResult {
  events?: EventForClient[];
  error?: string;
}

const G_SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const G_SHEET_IDS_STRING = process.env.GOOGLE_SHEET_IDS;
const G_SHEET_EVENT_LABELS_STRING = process.env.GOOGLE_SHEET_EVENT_LABELS;

export async function getEventListForClient(): Promise<EventListResult> {
  if (!G_SHEETS_API_KEY || G_SHEETS_API_KEY === "YOUR_GOOGLE_SHEETS_API_KEY_HERE") {
    console.error("Google Sheets API key is not configured.");
    return { error: "Application is not configured to access Google Sheets. Please contact support." };
  }
  if (!G_SHEET_IDS_STRING || !G_SHEET_EVENT_LABELS_STRING) {
    console.error("Google Sheet IDs or Event Labels are not configured in environment variables.");
    return { error: "Event list is not configured. Please contact support." };
  }

  const sheetIds = G_SHEET_IDS_STRING.split(',').map(id => id.trim()).filter(id => id);
  const eventLabels = G_SHEET_EVENT_LABELS_STRING.split(',').map(label => label.trim()).filter(label => label);

  if (sheetIds.length === 0 || eventLabels.length === 0) {
    console.warn("No Google Sheet IDs or Event Labels found after parsing environment variables.");
    return { events: [] };
  }

  if (sheetIds.length !== eventLabels.length) {
    console.error("Mismatch between the number of Google Sheet IDs and Event Labels in environment variables.");
    return { error: "Event list configuration error. Please contact support." };
  }

  const eventsForClient: EventForClient[] = eventLabels.map((label, index) => ({
    value: String(index), // Use index as the value
    label: label,
  }));

  return { events: eventsForClient };
}


export async function searchAthleteData(
  eventIdentifier: string, // This will be the index of the event
  query: string
): Promise<SearchResult> {
  if (!G_SHEETS_API_KEY || G_SHEETS_API_KEY === "YOUR_GOOGLE_SHEETS_API_KEY_HERE") {
    console.error("Google Sheets API key is not configured.");
    return { error: "Application is not configured to access Google Sheets. Please contact support." };
  }

  if (!G_SHEET_IDS_STRING) {
    console.error("Google Sheet IDs are not configured in environment variables.");
    return { error: "Event data source is not configured. Please contact support." };
  }
  
  const sheetIds = G_SHEET_IDS_STRING.split(',').map(id => id.trim()).filter(id => id);
  if (sheetIds.length === 0) {
    return { error: "No event data sources available." };
  }

  const eventIndex = parseInt(eventIdentifier, 10);
  if (isNaN(eventIndex) || eventIndex < 0 || eventIndex >= sheetIds.length) {
    return { error: "Invalid event selected." };
  }

  const eventId = sheetIds[eventIndex]; // Get the actual Sheet ID

  if (!query || query.trim() === "") {
    return { error: "Search query cannot be empty." };
  }

  const normalizedQuery = query.trim().toLowerCase();
  const range = "A:Z"; 
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${eventId}/values/${range}?key=${G_SHEETS_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error fetching from Google Sheets API:", response.status, errorData);
      if (response.status === 403) {
        return { error: "Access to the selected Google Sheet is forbidden. Check API key permissions or Sheet sharing settings." };
      }
      if (response.status === 404) {
        return { error: "The selected Google Sheet was not found. Please check the event ID." };
      }
      return { error: `Failed to fetch data from Google Sheets. Status: ${response.status}` };
    }

    const data = await response.json();

    if (!data.values || data.values.length === 0) {
      return { data: [] }; 
    }

    const headers = data.values[0].map((h: string) => h.toLowerCase().trim());
    const rows = data.values.slice(1);

    const nameIndex = headers.indexOf("name");
    const bibIndex = headers.indexOf("bib number");
    const phoneIndex = headers.indexOf("phone");
    const emailIndex = headers.indexOf("email");
    const ticketIndex = headers.indexOf("ticket name");

    const missingColumnsLog: string[] = [];
    if (nameIndex === -1) missingColumnsLog.push("Name");
    if (bibIndex === -1) missingColumnsLog.push("Bib Number");
    // Optional columns, log if not found for completeness of search capabilities
    if (phoneIndex === -1) console.warn("Optional column 'Phone' not found in sheet headers.");
    if (emailIndex === -1) console.warn("Optional column 'Email' not found in sheet headers.");
    if (ticketIndex === -1) missingColumnsLog.push("Ticket Name");


    if (missingColumnsLog.length > 0) {
        console.warn(`One or more expected columns (${missingColumnsLog.join(', ')}) not found in sheet headers. This may affect search or display functionality. Found headers:`, headers);
    }

    const filteredRows = rows.filter((row: any[]) => {
      const name = nameIndex !== -1 && row[nameIndex] ? String(row[nameIndex]).toLowerCase() : "";
      const bib = bibIndex !== -1 && row[bibIndex] ? String(row[bibIndex]).toLowerCase() : "";
      const phone = phoneIndex !== -1 && row[phoneIndex] ? String(row[phoneIndex]).toLowerCase() : "";
      const email = emailIndex !== -1 && row[emailIndex] ? String(row[emailIndex]).toLowerCase() : "";
      
      return (
        (name && name.includes(normalizedQuery)) ||
        (bib && bib.includes(normalizedQuery)) ||
        (phone && phone.includes(normalizedQuery)) ||
        (email && email.includes(normalizedQuery))
      );
    });

    const resultData: AthleteInfo[] = filteredRows.map((row: any[]) => ({
      bibNumber: bibIndex !== -1 && row[bibIndex] ? String(row[bibIndex]) : "N/A",
      name: nameIndex !== -1 && row[nameIndex] ? String(row[nameIndex]) : "N/A",
      ticketName: ticketIndex !== -1 && row[ticketIndex] ? String(row[ticketIndex]) : "N/A",
    }));

    return { data: resultData };

  } catch (error) {
    console.error("Error processing Google Sheets data:", error);
    return { error: "An unexpected error occurred while fetching or processing data." };
  }
}
