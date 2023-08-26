---
title: "How to Create or Modify Cases with the Import Tool"
description: "Admins learn how to create or modify existing cases with the Import tool."
tags: [
    "create case",
    "bulk file",
    "Import file"
]
categories: ["3-managing-cases"]
related: ["formatting-case-management-with-the-import-tool"]
---
# How to Create or Modify Cases with the Import Tool
This article shows admins how to create or modify existing cases with the Import tool.

## Opening the Import tool

1. Log in to the admin account.
2. Locate an app on the Apps page and click the ADMIN button.
3. On the Admin panel, click the Integration tab and then IMPORTS on the submenu.
4. Click the NEW button. The Add Imports dialog box displays in a new browser tab.

![img](/images/import-3.png)

## Creating cases
After the Add Imports dialog box opens:

1. Click the Type field and select an option (see below). A link displays.
2. Click the Download Sample link. A CSV file downloads to your device.

Next, open the file and add cases.

## Type
When you click the **Type** field, a drop-down menu displays. Choose one of two options for bulk case imports.

* **Note**  The drop-down menu has many options, but only two are related to managing case. Each option has a different sample CSV file.

### Add cases
* Choose this option for a simple bulk upload of cases. 
* Click the Download Sample link to open a CSV file with column headings for the Create cases import type.


### Modify cases
* Choose this option to update current cases. 
* Click the Download Sample link to open a CSV file with column headings for the Modify cases import type.


## Uploading the file
You can upload a file right away or return to the Add Imports dialog box at a later date and complete these steps.

1. Open the Add Imports dialog box.
2. Enter a unique name for the CSV file.
3. Click the plus (+) icon to upload the file from your device.
4. Click the Type field and select an option. (see above)
5. Click SAVE.

![img](/images/import-case-2.png)

## Formatting
These are the required fields and first requirements. Click <a href="docs/create-formatting-case-management-data-with-the-import-tool" target="_blank">here</a> to review formatting details. 

**tag_id (or case_ID)**
a unique identifier (use alphanumeric characters, hyphens are accepted)

**case_status**
0 = closed
1 = active

**date_opened**
month/day/year
mm/dd/yyyy

**about**
a unique description of the case (use alphanumeric characters, hyphens are accepted)

![img](/images/create-case-8.png)

## Processing
Depending on the number of records in the file and system load, the platform can take several minutes to process the import.  

![img](/images/create-case-9.png)

When the import completes, the platform adjusts case records (i.e. adds or modifies) on the admin’s Cases dashboard.

## Failure

If the import operation fails, the platform returns a Failed message. In most cases, the cause of failure is data formatting.

![img](/images/create-case-10.png)

To see the cause of the failure:

1. Click View under the ACTION heading.
2. On the next page, hover the mouse on the Failed icon. The tooltip displays the error.
3. Go to the CVS file and adjust and fix the error.
4. Upload the file again.

![img](/images/create-case-11.png)
