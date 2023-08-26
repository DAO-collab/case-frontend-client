---
title: "How to Create or Modify Users with the Import Tool"
description: "Admins learn how to create or modify existing users with the Import tool."
tags: [
    "create user",
    "Import file",
    "bulk file"
]
categories: ["5-managing-users"]
related: [
    "formatting-user-management-with-the-import-tool"
]
---
# How to Create or Modify Users with the Import Tool

This article shows admins how to create users with the Import tool.

## Opening the Import tool

Admins can use the Import tool to bulk upload new users and modify existing user records.

1. Log in to the admin account.
2. Locate an app on the Apps page and click the ADMIN button.
3. On the Admin panel, click the Integration tab and then IMPORTS on the submenu.
4. Click the NEW button. The Add Imports dialog box displays in a new browser tab.

![img](/images/import-3.png)


## Creating records

After the Add Imports dialog box opens:

1. Click the **Type** field and select an option (see below). A link displays.
2. Click the **Download Sample** link. A CSV file downloads to your device.

Next, open the file and add records. Click <a href="docs/how-to-format-csv-data" target="_blank">here</a> to learn how to use format data in the CSV file.

![img](/images/import-4.png)

## Type

When you click the Type field, a drop-down menu displays. Choose one of two options for bulk imports.

:exclamation: **NOTE**   The drop-down menu has many options, but only two are related to the Import tool. Each option has a different sample CSV file.

### Add users

* Choose this option for a simple bulk upload of user records. 
* Click the Download Sample link to open a CSV file with column headings for the Add users Import type.

### Modify users

* Choose this option to update data for current users. 
* Click the Download Sample link to open a CSV file with column headings for the Modify users Import type.

## Uploading the file

You can upload a file right away or return to the Add Imports dialog box at a later date and complete these steps.

1. Open the Add Imports dialog box.
2. Enter a unique name for the CSV file.
3. Click the plus (+) icon to upload the file from your device.
4. Click the **Type** field and select an option. (see above)
5. Click SAVE.

![img](/images/import-5.png)


## Processing

Depending on the number of records in the file and system load, the platform can take several minutes to process the import.  

![img](/images/import-6.png)

When the import completes, the platform adjusts user records (i.e. adds, modifies, or disables) on the admin’s **Users** dashboard.

## Failure
If the import operation fails, the platform returns a Failed message. In most cases, the cause of failure is data formatting.

![img](/images/import-7.png)

To see the cause of the failure:

1. Click **View** under the Action heading.
2. Ont the next page, hover the mouse on the Failed icon. The tooltip displays the error.
3. Go to the CVS file and adjust and fix the error.
4. Upload the file again.

![img](/images/import-8.png)
