---
title: 'Formatting User Management Data with the Import Tool'
description: 'Format data for User Management Data with the Import Tool'
tags: ['data format', 'CSV', 'import']
categories: []
related: []
---

# Formatting User Management Data with the Import Tool

Below is a list of data fields in CSV files. Each import option has a different combination of fields.

## username

- Enter the user’s email address.

## given_name

- Enter the user’s first name.

## family_name

- Enter the user’s last name.

## locale

- This column checks for user’s preferred language.
- Enter en for English, sp for Spanish.

## zoneinfo

- This sets the user time zone. Enter the continent and city with no spaces (use an underscore).
- Must use an option in the Profile > LANGUAGE & REGION > Timezone drop-down menu.
- Use the best-fit time zone. For example, Boston is not on the drop-down, so we can use New York (or any city in the EST/EDT time zone).

## host_tag_id

- Enter a permanent label.
- a-z, 0-9, -, / are allowed.

## case_status

- 0 = closed
- 1 = active
