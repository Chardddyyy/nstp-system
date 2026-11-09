/**
 * ==============================================================================
 * Google Apps Script (Code.gs) para sa Malinis at Isahang GDrive Backup
 * ==============================================================================
 * 
 * Paano Gamitin:
 * 1. Pumunta sa https://script.google.com/ gamit ang cvsunaicnstp@gmail.com
 * 2. Buksan ang inyong Apps Script Project.
 * 3. I-replace/I-paste ang buong code sa ibaba sa `Code.gs`.
 * 4. I-click ang "Deploy" > "Manage Deployments" > "Edit" (pencil icon) > 
 *    Version: "New version" > I-click ang "Deploy".
 * 5. Siguraduhing "Anyone" ang naka-set sa "Who has access".
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    system: 'Cavite State University Naic - NSTP Automated Backup Webhook',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var data = JSON.parse(rawData);

    // Kuhanin ang opisyal na folder sa Google Drive ng account para sa backups
    var targetFolderId = data.folderId || '1KLcAXPauT6WDRwOgSbOaCLSaNWyciXh1';
    var folder = null;
    if (targetFolderId) {
      try {
        folder = DriveApp.getFolderById(targetFolderId);
      } catch (err) {
        console.error('Error getting folder by ID ' + targetFolderId + ':', err);
        folder = null;
      }
    }

    // Kung hindi makuha ang folder ID (hal. permissions), mag-fallback sa "CvSU_NSTP_Backups" folder
    if (!folder) {
      var folderName = 'CvSU_NSTP_Backups';
      var existingFolders = DriveApp.getFoldersByName(folderName);
      if (existingFolders.hasNext()) {
        folder = existingFolders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
    }

    // 1. LINISIN ANG MGA LUMANG KALAT NA BACKUP FILES
    // Kapag cleanOld = true, itatapon sa trash ang mga lumang duplicate backup dumps
    if (data.cleanOld) {
      var files = folder.getFiles();
      while (files.hasNext()) {
        var oldFile = files.next();
        if (oldFile.getName().indexOf('CvSU_NSTP_') !== -1 || oldFile.getName().indexOf('.json') !== -1) {
          oldFile.setTrashed(true);
        }
      }
    }

    // 2. ISAHANG MALINIS NA BACKUP FILE
    var fileName = data.fileName || 'CvSU_NSTP_Latest_Database_Backup.json';
    var fileContent = typeof data.backupData === 'string' 
      ? data.backupData 
      : JSON.stringify(data.backupData || data, null, 2);

    // Kung umiiral na ang file, i-update ang laman; kung wala pa, gumawa ng bago
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
      folderName: folder.getName(),
      folderUrl: folder.getUrl(),
      updatedAt: new Date().toISOString(),
      message: 'Backup file saved successfully to Google Drive'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
