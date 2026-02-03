/**
 * Google Apps Script - Solar Site Visit Backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create new project, name it "Solar Checklist Backend"
 * 3. Paste this entire code
 * 4. Update SHEET_ID and ADMIN_EMAIL below
 * 5. Click Deploy > New deployment > Web app
 * 6. Set "Execute as" = Me, "Who has access" = Anyone
 * 7. Copy the Web app URL and paste it in the app config
 */

// ============ CONFIGURATION ============
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';  // Create a new Google Sheet and paste its ID here
const ADMIN_EMAIL = 'admin@everwatt.au';
const EMAIL_SUBJECT = 'New Solar Site Visit Report';
// ========================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Save to Google Sheet
    saveToSheet(data);
    
    // Send email notification
    sendEmailNotification(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Data saved and email sent' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Solar Checklist API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveToSheet(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('Site Visits');
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Site Visits');
    // Add headers
    sheet.appendRow([
      'Timestamp',
      'Customer Name',
      'Address',
      'Phone',
      'Appointment Time',
      'Roof Type',
      'Roof Orientation',
      'Roof Pitch',
      'Roof Area (m²)',
      'Grid Type',
      'Meter Model',
      'Switchboard Capacity',
      'Battery Location',
      'Monthly Usage',
      'Peak Hours',
      'Has EV',
      'Has Pool',
      'Has A/C',
      'Budget',
      'Install Timeframe',
      'Notes',
      'Pre-Visit Complete',
      'Roof Check Complete',
      'Electrical Check Complete',
      'Battery Check Complete',
      'Final Check Complete',
      'Photo Count'
    ]);
    // Format header row
    sheet.getRange(1, 1, 1, 27).setFontWeight('bold').setBackground('#f97316').setFontColor('white');
    sheet.setFrozenRows(1);
  }
  
  // Calculate completion percentages
  const preComplete = countChecked(data.preChecks);
  const roofComplete = countChecked(data.roof?.checks);
  const elecComplete = countChecked(data.electrical?.checks);
  const batComplete = countChecked(data.battery?.checks);
  const finalComplete = countChecked(data.finalChecks);
  
  const photoCount = (data.photos?.roof?.length || 0) + 
                     (data.photos?.electrical?.length || 0) + 
                     (data.photos?.battery?.length || 0);
  
  // Add row
  sheet.appendRow([
    new Date(data.timestamp),
    data.customer?.name || '',
    data.customer?.address || '',
    data.customer?.phone || '',
    data.customer?.appointmentTime || '',
    data.roof?.type || '',
    data.roof?.orientation || '',
    data.roof?.angle || '',
    data.roof?.area || '',
    data.electrical?.gridType || '',
    data.electrical?.meterModel || '',
    data.electrical?.panelCapacity || '',
    data.battery?.location || '',
    data.requirements?.monthlyUsage || '',
    data.requirements?.peakHours || '',
    data.requirements?.hasEV ? 'Yes' : 'No',
    data.requirements?.hasPool ? 'Yes' : 'No',
    data.requirements?.hasAC ? 'Yes' : 'No',
    data.requirements?.budget || '',
    data.requirements?.installTime || '',
    data.notes || '',
    preComplete,
    roofComplete,
    elecComplete,
    batComplete,
    finalComplete,
    photoCount
  ]);
}

function countChecked(checks) {
  if (!checks) return '0%';
  const values = Object.values(checks);
  const total = values.length;
  const checked = values.filter(v => v === true).length;
  return total > 0 ? Math.round((checked / total) * 100) + '%' : '0%';
}

function sendEmailNotification(data) {
  const photoCount = (data.photos?.roof?.length || 0) + 
                     (data.photos?.electrical?.length || 0) + 
                     (data.photos?.battery?.length || 0);
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0;">☀️ New Site Visit Report</h1>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #f97316; padding-bottom: 10px;">👤 Customer Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #64748b;">Name:</td><td style="padding: 8px 0; font-weight: bold;">${data.customer?.name || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Address:</td><td style="padding: 8px 0;">${data.customer?.address || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Phone:</td><td style="padding: 8px 0;">${data.customer?.phone || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Appointment:</td><td style="padding: 8px 0;">${data.customer?.appointmentTime || '-'}</td></tr>
        </table>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-top: 20px;">🏠 Roof Assessment</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #64748b;">Type:</td><td style="padding: 8px 0;">${data.roof?.type || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Orientation:</td><td style="padding: 8px 0;">${data.roof?.orientation || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Pitch:</td><td style="padding: 8px 0;">${data.roof?.angle || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Area:</td><td style="padding: 8px 0;">${data.roof?.area ? data.roof.area + ' m²' : '-'}</td></tr>
        </table>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-top: 20px;">⚡ Electrical</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #64748b;">Grid Type:</td><td style="padding: 8px 0;">${data.electrical?.gridType || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Meter:</td><td style="padding: 8px 0;">${data.electrical?.meterModel || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Switchboard:</td><td style="padding: 8px 0;">${data.electrical?.panelCapacity || '-'}</td></tr>
        </table>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-top: 20px;">🔋 Battery</h2>
        <p>Location: ${data.battery?.location || '-'}</p>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-top: 20px;">📊 Customer Requirements</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #64748b;">Monthly Usage:</td><td style="padding: 8px 0;">${data.requirements?.monthlyUsage || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Peak Hours:</td><td style="padding: 8px 0;">${data.requirements?.peakHours || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Special Equipment:</td><td style="padding: 8px 0;">${[data.requirements?.hasEV && 'EV Charger', data.requirements?.hasPool && 'Pool Pump', data.requirements?.hasAC && 'Ducted A/C'].filter(Boolean).join(', ') || 'None'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Budget:</td><td style="padding: 8px 0;">${data.requirements?.budget || '-'}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Timeframe:</td><td style="padding: 8px 0;">${data.requirements?.installTime || '-'}</td></tr>
        </table>
        
        <h2 style="color: #1e293b; border-bottom: 2px solid #f97316; padding-bottom: 10px; margin-top: 20px;">📝 Notes</h2>
        <p style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">${data.notes || 'No notes'}</p>
        
        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
          <strong>📷 Photos attached:</strong> ${photoCount} photos
        </div>
      </div>
      
      <div style="background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 12px 12px; font-size: 12px;">
        Submitted via Solar Site Visit Checklist App • ${new Date(data.timestamp).toLocaleString('en-AU')}
      </div>
    </div>
  `;
  
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: `${EMAIL_SUBJECT} - ${data.customer?.name || 'New Customer'}`,
    htmlBody: htmlBody
  });
}

// Test function - run this to test your setup
function testSetup() {
  const testData = {
    timestamp: new Date().toISOString(),
    customer: { name: 'Test Customer', address: '123 Test St', phone: '0400000000' },
    roof: { type: 'tile', orientation: 'north' },
    electrical: { gridType: 'single' },
    battery: { location: 'garage' },
    requirements: { budget: '10-15k' },
    preChecks: { pre1: true, pre2: true },
    notes: 'This is a test submission'
  };
  
  saveToSheet(testData);
  sendEmailNotification(testData);
  Logger.log('Test completed! Check your sheet and email.');
}
