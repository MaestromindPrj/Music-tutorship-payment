const PAYMENTS_SHEET_NAME = "Payments";
const REGISTRATIONS_SHEET_NAME = "Registrations";

function doPost(e) {
  try {
    const rawContent = e.postData.contents;
    const data = JSON.parse(rawContent);
    const action = data.action;

    let result = { success: false, error: "Invalid action" };

    if (action === "savePayment") {
      result = handleSavePayment(data.payment);
    } else if (action === "updatePaymentStatus") {
      result = handleUpdatePaymentStatus(data.txnid, data.status, data.details);
    } else if (action === "saveRegistration") {
      result = handleSaveRegistration(data.registration);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = params.action || "getDetails";
    const txnid = (params.txnid || "").trim();

    let result = { success: false, error: "Transaction ID is required" };

    if (txnid) {
      if (action === "getPayment") {
        result = handleGetPayment(txnid);
      } else if (action === "getRegistration") {
        result = handleGetRegistration(txnid);
      } else {
        const paymentRes = handleGetPayment(txnid);
        const regRes = handleGetRegistration(txnid);
        result = {
          success: paymentRes.success || regRes.success,
          payment: paymentRes.payment || null,
          registration: regRes.registration || null
        };
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#000000");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
    
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
  return sheet;
}

function handleSavePayment(payment) {
  if (!payment || !payment.txnid) {
    return { success: false, error: "Missing payment data or txnid" };
  }

  const headers = [
    "Timestamp", "Transaction ID", "Student Name", "Email", "Phone",
    "Course Name", "Course ID", "Amount (₹)", "Status", "PayU ID",
    "Payment Mode", "Bank Ref Num", "Error Message", "Updated At"
  ];
  const sheet = getOrCreateSheet(PAYMENTS_SHEET_NAME, headers);
  const data = sheet.getDataRange().getValues();
  const txnid = String(payment.txnid).trim();

  const now = new Date().toISOString();
  const rowData = [
    payment.createdAt || now,
    txnid,
    payment.studentName || "",
    payment.email || "",
    payment.phone || "",
    payment.courseName || "",
    payment.courseId || "mastery",
    payment.amount || 0,
    payment.status || "PENDING",
    payment.payuId || "",
    payment.mode || "",
    payment.bankRefNum || "",
    payment.errorMessage || "",
    payment.updatedAt || now
  ];

  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === txnid.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { success: true, txnid: txnid };
}

function handleUpdatePaymentStatus(txnid, status, details) {
  if (!txnid) return { success: false, error: "Missing txnid" };

  const headers = [
    "Timestamp", "Transaction ID", "Student Name", "Email", "Phone",
    "Course Name", "Course ID", "Amount (₹)", "Status", "PayU ID",
    "Payment Mode", "Bank Ref Num", "Error Message", "Updated At"
  ];
  const sheet = getOrCreateSheet(PAYMENTS_SHEET_NAME, headers);
  const data = sheet.getDataRange().getValues();
  const cleanTxnid = String(txnid).trim();

  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === cleanTxnid.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  const now = new Date().toISOString();

  if (foundRow > 0) {
    sheet.getRange(foundRow, 9).setValue(status);
    if (details) {
      if (details.payuId) sheet.getRange(foundRow, 10).setValue(details.payuId);
      if (details.mode) sheet.getRange(foundRow, 11).setValue(details.mode);
      if (details.bankRefNum) sheet.getRange(foundRow, 12).setValue(details.bankRefNum);
      if (details.errorMessage) sheet.getRange(foundRow, 13).setValue(details.errorMessage);
    }
    sheet.getRange(foundRow, 14).setValue(now);
    return { success: true, txnid: cleanTxnid, updated: true };
  } else {
    const newRow = [
      now,
      cleanTxnid,
      details?.studentName || "Student",
      details?.email || "",
      details?.phone || "",
      details?.courseName || "Complete Music Production Mastery Course",
      details?.courseId || "mastery",
      details?.amount || 1,
      status,
      details?.payuId || "",
      details?.mode || "",
      details?.bankRefNum || "",
      details?.errorMessage || "",
      now
    ];
    sheet.appendRow(newRow);
    return { success: true, txnid: cleanTxnid, inserted: true };
  }
}

function handleSaveRegistration(reg) {
  if (!reg || !reg.txnid) {
    return { success: false, error: "Missing registration data or txnid" };
  }

  const headers = [
    "Submitted At", "Transaction ID", "Student Full Name", "DOB", "Address",
    "Aadhar Card", "Gender", "Email", "Phone", "PAN", "Occupation"
  ];
  const sheet = getOrCreateSheet(REGISTRATIONS_SHEET_NAME, headers);
  const data = sheet.getDataRange().getValues();
  const txnid = String(reg.txnid).trim();

  const now = new Date().toISOString();
  const rowData = [
    reg.submittedAt || now,
    txnid,
    reg.fullName || "",
    reg.dob || "",
    reg.address || "",
    "'" + String(reg.aadharCard || ""),
    reg.gender || "",
    reg.email || "",
    "'" + String(reg.phone || ""),
    reg.pan || "",
    reg.occupation || ""
  ];

  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === txnid.toLowerCase()) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { success: true, txnid: txnid };
}

function handleGetPayment(txnid) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(PAYMENTS_SHEET_NAME);
  if (!sheet) return { success: false, error: "Payments sheet not initialized" };

  const data = sheet.getDataRange().getValues();
  const cleanTxnid = String(txnid).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === cleanTxnid) {
      const row = data[i];
      return {
        success: true,
        payment: {
          createdAt: row[0],
          txnid: row[1],
          studentName: row[2],
          email: row[3],
          phone: row[4],
          courseName: row[5],
          courseId: row[6],
          amount: Number(row[7]),
          status: row[8],
          payuId: row[9],
          mode: row[10],
          bankRefNum: row[11],
          errorMessage: row[12],
          updatedAt: row[13]
        }
      };
    }
  }

  return { success: false, error: "Payment not found" };
}

function handleGetRegistration(txnid) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(REGISTRATIONS_SHEET_NAME);
  if (!sheet) return { success: false, error: "Registrations sheet not initialized" };

  const data = sheet.getDataRange().getValues();
  const cleanTxnid = String(txnid).trim().toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === cleanTxnid) {
      const row = data[i];
      return {
        success: true,
        registration: {
          submittedAt: row[0],
          txnid: row[1],
          fullName: row[2],
          dob: row[3],
          address: row[4],
          aadharCard: String(row[5]).replace(/^'/, ""),
          gender: row[6],
          email: row[7],
          phone: String(row[8]).replace(/^'/, ""),
          pan: row[9],
          occupation: row[10]
        }
      };
    }
  }

  return { success: false, error: "Registration not found" };
}

function importNeonData() {
  const neonPayments = [
    {
      txnid: "MT-MUPNWQWS-2568879A",
      amount: 1.00,
      courseName: "Complete Music Production Mastery Course",
      courseId: "mastery",
      studentName: "test",
      email: "test@gmail.com",
      phone: "1234567890",
      status: "SUCCESS",
      payuId: "31025600871",
      mode: "UPI",
      bankRefNum: "315943031825",
      createdAt: "2026-10-01T15:01:35.084Z",
      updatedAt: "2026-10-01T15:01:59.692Z"
    },
    {
      txnid: "MT-MUPOITP1-6AE43041",
      amount: 1.00,
      courseName: "Complete Music Production Mastery Course",
      courseId: "mastery",
      studentName: "M VISHAL SAKTHI",
      email: "vickyvarun212@gmail.com",
      phone: "09791981863",
      status: "PENDING",
      createdAt: "2026-10-01T15:18:45.715Z",
      updatedAt: "2026-10-01T15:18:45.715Z"
    },
    {
      txnid: "MT-MUPXCNIZ-94BED541",
      amount: 1.00,
      courseName: "Complete Music Production Mastery Course",
      courseId: "mastery",
      studentName: "Vijay L J",
      email: "producingwithvijay@gmail.com",
      phone: "9514499932",
      status: "PENDING",
      createdAt: "2026-10-01T19:25:54.363Z",
      updatedAt: "2026-10-01T19:25:54.363Z"
    },
    {
      txnid: "MT-MUPXOKB5-0FC3D60F",
      amount: 1.00,
      courseName: "Complete Music Production Mastery Course",
      courseId: "mastery",
      studentName: "Vijay L J",
      email: "producingwithvijay@gmail.com",
      phone: "9514499932",
      status: "SUCCESS",
      payuId: "31029816612",
      mode: "UPI",
      bankRefNum: "627538125741",
      createdAt: "2026-10-01T19:35:09.999Z",
      updatedAt: "2026-10-01T19:35:51.871Z"
    }
  ];

  const neonRegistrations = [
    {
      txnid: "MT-MUPNWQWS-2568879A",
      fullName: "test",
      dob: "2008-03-05",
      address: "34/ghjn",
      aadharCard: "345678908765",
      gender: "Male",
      email: "test@gmail.com",
      phone: "1234567890",
      pan: "ABCDE4578F",
      occupation: "student",
      submittedAt: "2026-10-01T15:02:44.507Z"
    },
    {
      txnid: "MT-MUPXOKB5-0FC3D60F",
      fullName: "Vijay L J",
      dob: "1999-06-23",
      address: "(Near Raju Electricals) Shanmughamani Illam, Lake View Road, West Mambalam",
      aadharCard: "892389839839",
      gender: "Male",
      email: "producingwithvijay@gmail.com",
      phone: "9514499932",
      pan: "AUZPV5509J",
      occupation: "hnk fhd fjdh f dhfjdf",
      submittedAt: "2026-10-01T19:40:06.002Z"
    }
  ];

  for (var i = 0; i < neonPayments.length; i++) {
    handleSavePayment(neonPayments[i]);
  }

  for (var j = 0; j < neonRegistrations.length; j++) {
    handleSaveRegistration(neonRegistrations[j]);
  }
}
