import { PropertyStop } from './types';

/**
 * Generate Google Maps navigation link based on address
 */
export const getGoogleMapsUrl = (address: string, cityStateZip: string): string => {
  const query = encodeURIComponent(`${address}, ${cityStateZip}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
};

/**
 * Generate Apple Maps navigation link based on address (ideal for iPhone agents)
 */
export const getAppleMapsUrl = (address: string, cityStateZip: string): string => {
  const query = encodeURIComponent(`${address}, ${cityStateZip}`);
  return `maps://maps.apple.com/?daddr=${query}&dirflg=d`;
};

/**
 * Encodes the app's current walkthrough state into a shareable URLs Base64 string
 */
export const encodeWalkthroughState = (state: { stops: PropertyStop[]; inspector: string }): string => {
  try {
    const jsonStr = JSON.stringify(state);
    // Use Web API btoa with encoded URI component to support special characters
    return btoa(encodeURIComponent(jsonStr));
  } catch (error) {
    console.error('Error encoding walkthrough state:', error);
    return '';
  }
};

/**
 * Decodes shared base64 string from URL back to walkthrough state
 */
export const decodeWalkthroughState = (base64Str: string): { stops: PropertyStop[]; inspector: string } | null => {
  try {
    const decodedStr = decodeURIComponent(atob(base64Str));
    return JSON.parse(decodedStr);
  } catch (error) {
    console.error('Failed to decode walkthrough state:', error);
    return null;
  }
};

/**
 * Formats date to a clean, readable text representation
 */
export const formatTimestamp = (date: Date = new Date()): string => {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Formats a number to a US cash currency string
 */
export const formatCurrency = (amount?: number): string => {
  if (amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Generates and triggers download of the structured, enterprise-grade inspection text report
 */
export const downloadTextReport = (stops: PropertyStop[], inspector: string): void => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const title = `TOOENSURE LLC — PROPERTY WALKTHROUGH REPORT`;
  const timeStr = formatTimestamp(new Date());

  let totalItems = 0;
  let checkedItems = 0;
  stops.forEach((stop) => {
    totalItems += stop.items.length;
    checkedItems += stop.items.filter((i) => i.checked).length;
  });

  const completionPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  let reportText = `========================================================================
${title}
========================================================================
Inspector:   ${inspector || 'Field Agent'}
Date:        ${timeStr}
Progress:    ${completionPct}% (${checkedItems}/${totalItems} items completed)
Total Stops: ${stops.length}
========================================================================

`;

  stops.forEach((stop, idx) => {
    const stopTotal = stop.items.length;
    const stopChecked = stop.items.filter((i) => i.checked).length;
    const stopPct = stopTotal > 0 ? Math.round((stopChecked / stopTotal) * 100) : 0;

    reportText += `STOP #${idx + 1}: ${stop.address.toUpperCase()}
------------------------------------------------------------------------
Location:       ${stop.cityStateZip}
Priority:       ${stop.priority.toUpperCase()} (${stop.tag})
Completion:    ${stopPct}% (${stopChecked}/${stopTotal} Completed)
Delinquent:    ${formatCurrency(stop.delinquentAmount)}
Last Active:    ${stop.completedAt ? stop.completedAt : 'In Progress'}

FIELD NOTES:
${stop.notes ? stop.notes.trim() : 'No field notes captured.'}

CHECKLIST:
`;

    // Group items by category for cleaner reading
    const categories = {
      occupancy: 'Occupancy Check',
      exterior: 'Exterior Check',
      vacancy: 'Vacancy/Contact Indicators',
    };

    (Object.keys(categories) as Array<keyof typeof categories>).forEach((catKey) => {
      const catTitle = categories[catKey];
      const catItems = stop.items.filter((item) => item.category === catKey);

      reportText += `\n  [ ${catTitle.toUpperCase()} ]\n`;
      catItems.forEach((item) => {
        const mark = item.checked ? '[X]' : '[ ]';
        reportText += `  ${mark} ${item.label}\n`;
      });
    });

    if (stop.photos.length > 0) {
      reportText += `\nATTACHED PHOTOS: ${stop.photos.length} captured photo(s) inline in base64 state.\n`;
      stop.photos.forEach((photo, pIdx) => {
        reportText += `  - Photo #${pIdx + 1} timestamp: ${photo.timestamp}\n`;
      });
    } else {
      reportText += `\nATTACHED PHOTOS: None\n`;
    }

    reportText += `\n========================================================================\n\n`;
  });

  reportText += `Generated securely via Tooensure LLC Property Walkthrough System.\n`;

  // Trigger download in browser
  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Tooensure-Walkthrough-${dateStr}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
