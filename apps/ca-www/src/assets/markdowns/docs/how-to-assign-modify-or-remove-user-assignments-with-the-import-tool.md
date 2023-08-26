---
title: 'How to Assign, Modify or Remove User Assignments with the Import Tool'
description: 'Assign, Modify or Remove User Assignments with the Import Tool'
tags: ['manage users', 'assign users', 'cases']
categories: ['4-managing-case-permissions']
related: ['formatting-user-case-assignments-with-the-import-tool']
---

# How to Assign, Modify or Remove User Assignments with the Import Tool

This article shows admins how to manage case users with the Import tool.

Admins can:

- assign users to a case
- modify users already assigned to a case
- remove users assigned to a case

## Opening the Import tool

1. Log in to the admin account.
2. Locate an app on the Apps page and click the ADMIN button.
3. Click the Integration tab and then IMPORTS on the submenu.
4. Click the NEW button. The Add Imports dialog box displays.

## Creating records

Download one or more CSV files. Use these files to add, modify, or remove case users. After the Add Imports dialog box opens:

1. Click the Type field.
2. Scroll through the drop-down menu and select an option (see below). A link displays.
3. Click the Download Sample link. A CSV file downloads to your device.

![img](/images/user-case-import-1.png)

Open the file and add records. Click here to learn how to use format data in the CSV file.

### File options

**Assign users to cases**

- Choose this option to add users to a case.
- Leave the case_role_order cell blank.
- Go to the Users page and copy the Tag ID for this person. If the Tag ID field is blank, enter a unique ID, click Save, and then copy the ID to the CSV file.

![img](/images/user-case-import-2.png)

**Modify users assigned to cases**

- Choose this option to update data for current users assigned to a case.
- Use the Case Tag ID for the case_ID column.

![img](/images/user-case-import-3.png)

**Remove users assigned to cases**

- Choose this option to remove users assigned to a case.

![img](/images/user-case-import-4.png)

## Uploading the file

You can upload a file right away or return to the Add Imports dialog box at a later date and complete these steps.

1. Open the Add Imports dialog box.
2. Enter a unique name for the CSV file.
3. Click the plus (+) icon to upload the file from your device.
4. Click the Type field and select an option. (see above)
5. Click SAVE.

## Processing

Depending on the number of records in the file and system load, the platform can take several minutes to process the import.

![img](/images/user-case-import-5.png)

When the import completes, the platform adjusts user records (i.e. adds, modifies, or removes) on the Cases page.

## Failure

If the import operation fails, the platform returns a Failed message. In most cases, the cause of failure is data formatting.

![img](/images/user-case-import-6.png)

To see the cause of the failure:

1. Click View under the Action heading.
2. On the next page, hover the mouse on the Failed icon. The tooltip displays the error.
3. Go to the CVS file and adjust and fix the error.
4. Upload the file again.

![img](/images/user-case-import-7.png)
