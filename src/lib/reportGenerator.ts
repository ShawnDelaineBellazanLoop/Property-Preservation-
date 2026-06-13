import { PropertyStop, IdentityInjection } from '../types';

/**
 * Generates a high-fidelity ASCII report for professional property preservation delivery.
 */
export function generateTextReport(stops: PropertyStop[], identity: IdentityInjection): string {
    const now = new Date().toLocaleString();
    const totalPhotos = stops.reduce((acc, s) => acc + (s.photos?.length || 0), 0);

    // High-fidelity box-drawing characters
    const dividerDouble = "═".repeat(65);
    const dividerSingle = "─".repeat(65);

    let report = `${dividerDouble}\n`;
    report += `  ${identity.company.toUpperCase()} — PROPERTY WALKTHROUGH REPORT\n`;
    report += `${dividerDouble}\n`;
    report += `  Inspector : ${identity.inspector_name}\n`;
    report += `  Generated : ${now}\n`;
    report += `  Stops     : ${stops.length}\n`;
    report += `  Photos    : ${totalPhotos} total\n`;
    report += `${dividerDouble}\n\n`;

    stops.forEach((stop, index) => {
        const completedItems = Object.values(stop.checklist).filter(v => v).length;
        const totalItems = 20; // Standardizing to your 20-item count
        const progress = Math.round((completedItems / totalItems) * 100) || 0;

        report += `STOP ${index + 1} — ${stop.address}\n`;
        report += `  Work Order : ${stop.workOrderId || 'N/A'}\n`;
        report += `  Status     : ${(stop.status || 'PENDING').toUpperCase()}\n`;
        report += `  Progress   : ${progress}% (${completedItems}/${totalItems})\n\n`;

        // Category Mapping
        const categories = [
            {
                name: "Exterior",
                items: ["exterior_front", "exterior_rear", "roof_condition", "yard_debris", "foundation_siding", "windows_doors", "lock_change", "grass_cut"]
            },
            {
                name: "Interior",
                items: ["interior_photos", "hvac_inspect", "plumbing_leaks", "electrical_panel", "smoke_co_detectors", "water_heater", "appliances", "mold_assessment"]
            },
            {
                name: "Compliance",
                items: ["utility_shutoff", "property_secured", "order_signoff", "photos_uploaded"]
            }
        ];

        categories.forEach(cat => {
            report += `  ▸ ${cat.name}\n`;
            cat.items.forEach(id => {
                const isChecked = stop.checklist[id];
                const label = id.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                report += `    [${isChecked ? 'x' : ' '}] ${label}\n`;
            });
            report += `\n`;
        });

        if (stop.notes && stop.notes.length > 0) {
            report += `  FIELD NOTES\n`;
            stop.notes.forEach(note => {
                report += `    ${note}\n`;
            });
            report += `\n`;
        }

        if (stop.photos && stop.photos.length > 0) {
            report += `  PHOTOS (${stop.photos.length}) — see HTML report for images\n`;
            stop.photos.forEach((p, i) => {
                const size = Math.round((p.dataUrl.length * 0.75) / 1024); // Rough KB estimate
                const time = new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                report += `    [${i + 1}] photo_${i + 1}.jpg  captured ${time}  ~${size} KB\n`;
            });
        }

        report += `\n${dividerSingle}\n\n`;
    });

    return report;
}