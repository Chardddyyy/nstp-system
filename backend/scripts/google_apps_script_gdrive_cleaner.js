/**
 * ==============================================================================
 * Google Apps Script (Code.gs) para sa Malinis at Isahang GDrive Backup
 * ==============================================================================
 * 
 * Paano Gamitin:
 * 1. Pumunta sa https://script.google.com/
 * 2. Buksan ang inyong Apps Script Project na nakakabit sa Webhook URL.
 * 3. I-paste ang code sa ibaba sa `Code.gs`.
 * 4. I-click ang "Deploy" > "Manage Deployments" > "Edit" > New version > "Deploy".
 * 5. Siguraduhing "Anyone" ang may access upang matanggap ang webhook mula sa NSTP server.
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    // Default target Google Drive Folder ID
    var folderId = data.folderId || '1lWSgMdKMBD8148A_wFb6UufFgmloD4e3';
    var folder = DriveApp.getFolderById(folderId);

    // 1. LINISIN ANG MGA LUMANG KALAT NA BACKUP FILES
    // Kapag cleanOld = true, itatapon sa trash ang lahat ng lumang backup files sa folder
    // upang mapanatiling malinis at isa lang ang makikita.
    if (data.cleanOld) {
      var files = folder.getFiles();
      while (files.hasNext()) {
        var oldFile = files.next();
        // Linisin ang lahat ng lumang JSON o text dumps
        if (oldFile.getName().indexOf('CvSU_NSTP_') !== -1 || oldFile.getName().indexOf('.json') !== -1) {
          oldFile.setTrashed(true);
        }
      }
    }

    // 2. ISAHANG MALINIS NA BACKUP FILE
    var fileName = data.fileName || 'CvSU_NSTP_Latest_Database_Backup.json';
    var fileContent = JSON.stringify(data.backupData, null, 2);

    // Kung umiiral na ang file at hindi na-trash, i-update ang content; kung wala pa, gumawa ng bago
    var existingFiles = folder.getFilesByName(fileName);
    var targetFile;
    if (existingFiles.hasNext()) {
      targetFile = existingFiles.next();
      targetFile.setContent(fileContent);
    } else {
      targetFile = folder.createFile(fileName, fileContent, MimeType.PLAIN_TEXT);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: targetFile.getId(),
      fileName: targetFile.getName(),
      updatedAt: new Date().toISOString(),
      message: 'Clean unified backup saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
