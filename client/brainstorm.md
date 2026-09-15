# Mission Grading System — Implementation Wireframe

Field type is only noted when it isn't obvious from the label (dropdown, multi-line, date, repeater). Plain text fields are just shown with a blank.

---

## 1. Grading Scale

**Form**

```
Scale Name: ___________________________
Grade Levels (drag to reorder, add as many as needed)
   [ Level Name]  [ Value  ] [ X ]
   [ Level Name]  [ Value  ] [ X ]

[ Save Scale ]
```

**List page** (dummy data)

| Scale name       | # levels | Actions       |
| ---------------- | -------- | ------------- |
| ABC Scale        | 3        | Edit / Delete |
| Excellence Scale | 3        | Edit / Delete |
| Pass/Fail Scale  | 2        | Edit / Delete |

**Database**

```

grading_scales
id int PK
name string

grade_levels
id int PK
scale_id int FK -> grading_scales.id
label string
numeric_value float
sort_order int

```

---

## 2. Grading Criteria

**Form**

```

Criteria Name: ___________________________
Description (multi-line):

---

---

[ Save Criteria ]

```

**List page** (dummy data)

| Criteria name | Description                               | Actions       |
| ------------- | ----------------------------------------- | ------------- |
| Tactics       | Decision-making and battlefield awareness | Edit / Delete |
| Speed         | Time to complete objective                | Edit / Delete |
| Strength      | Physical load-bearing performance         | Edit / Delete |
| Marksmanship  | Accuracy on range qualification           | Edit / Delete |

**Database**

```

grading_criteria
id uuid PK
name string
description string

```

---

## 3. Grading Template

**Form**

```

Template Name: ___________________________
Scale: [ Dropdown: ABC Scale ▾ ]

Criteria + Weight (add as many as needed)
Criteria: [ Tactics ▾ ] Weight: ____ %
Criteria: [ Speed ▾ ] Weight: ____ %
Criteria: [ Strength ▾ ] Weight: ____ %
[+ Add criteria] Total: 100%

Final Grade Bands (optional — maps computed score to a label)
Min score: ____ → Grade: [ A ▾ ]
Min score: ____ → Grade: [ B ▾ ]
[+ Add band]

[ Save Template ]

```

**List page** (dummy data)

| Template name     | Scale            | # criteria | Version | Status | Actions       |
| ----------------- | ---------------- | ---------- | ------- | ------ | ------------- |
| Combat Readiness  | ABC Scale        | 3          | v2      | Active | Edit / Retire |
| Land Nav Standard | ABC Scale        | 2          | v1      | Active | Edit / Retire |
| Fitness Test      | Excellence Scale | 4          | v1      | Active | Edit / Retire |
| Marksmanship Qual | Pass/Fail Scale  | 1          | v3      | Draft  | Edit / Retire |

**Database**

```

grading_templates
id uuid PK
name string
scale_id uuid FK -> grading_scales.id
version int
status enum(draft, active, retired)
created_at datetime

template_criteria
id uuid PK
template_id uuid FK -> grading_templates.id
criteria_id uuid FK -> grading_criteria.id
weight float

grade_bands
id uuid PK
template_id uuid FK -> grading_templates.id
grade_level_id uuid FK -> grade_levels.id
min_score float
max_score float

```

---

## 4. Mission Type

Owns the link to a default template — this is the single place "type" is defined.

**Form**

```

Mission Type Name: ___________________________
Default Grading Template: [ Dropdown: Land Nav Standard ▾ ]

[ Save Mission Type ]

```

**List page** (dummy data)

| Mission type        | Default template  | Actions       |
| ------------------- | ----------------- | ------------- |
| Land Navigation     | Land Nav Standard | Edit / Delete |
| Combat Sim          | Combat Readiness  | Edit / Delete |
| Fitness             | Fitness Test      | Edit / Delete |
| Range Qualification | Marksmanship Qual | Edit / Delete |

**Database**

```

mission_types
id uuid PK
name string
default_template_id uuid FK -> grading_templates.id (nullable)

```

---

## 5. Mission

**Form**

```

Mission Title: ___________________________
Description (multi-line):

---

Mission Type: [ Dropdown: Land Navigation ▾ ] (auto-fills template below)
Grading Template: [ Auto-filled: Land Nav Standard ▾ ] (change only for a one-off exception)
Start Date/Time: __ / __ / ____ **:**
End Date/Time: __ / __ / ____ **:**
Assign Trainees: [ Multi-select: Cadet Sharma, Cadet Verma, ... ]

[ Save as Draft ] [ Publish ]

```

**List page** (dummy data)

| Title              | Type                | Status    | Start         | End           | # Trainees | Actions |
| ------------------ | ------------------- | --------- | ------------- | ------------- | ---------- | ------- |
| Night Recon Alpha  | Combat Sim          | Published | Sep 15, 06:00 | Sep 15, 18:00 | 12         | View    |
| Land Nav Course 4  | Land Navigation     | Grading   | Sep 10, 07:00 | Sep 10, 15:00 | 20         | Grade   |
| Annual PT Test     | Fitness             | Closed    | Aug 1, 06:00  | Aug 1, 09:00  | 45         | View    |
| Range Qual Batch 3 | Range Qualification | Draft     | Sep 20, 08:00 | Sep 20, 12:00 | 8          | Edit    |

**Database**

```

missions
id uuid PK
title string
description string
mission_type_id uuid FK -> mission_types.id
template_id uuid FK -> grading_templates.id
status enum(draft, published, completed, grading, evaluated, closed)
start_dt datetime
end_dt datetime
created_by uuid
created_at datetime

mission_trainees
id uuid PK
mission_id uuid FK -> missions.id
trainee_id uuid FK -> users.id
assigned_at datetime

```

`template_id` starts as a copy of `mission_type.default_template_id` at creation time, but is its own field — it's what a mission is actually graded against, and can be pointed at a different template for the rare one-off exception without touching the mission's type or the type's default.

---

## 6. Mission Lifecycle

No form — status changes via action buttons on the mission page.

| From      | Action                                   | To        |
| --------- | ---------------------------------------- | --------- |
| draft     | "Publish"                                | published |
| published | "Mark completed" (or auto at end_dt)     | completed |
| completed | "Start grading"                          | grading   |
| grading   | auto, once every trainee is fully graded | evaluated |
| evaluated | "Close mission"                          | closed    |

**Dummy history — "Land Nav Course 4"**

| From      | To        | By        | When          |
| --------- | --------- | --------- | ------------- |
| draft     | published | Capt. Rao | Sep 1, 10:00  |
| published | completed | auto      | Sep 10, 15:00 |
| completed | grading   | Capt. Rao | Sep 10, 15:05 |

**Database**

```

mission_status_log (optional, for audit trail)
id uuid PK
mission_id uuid FK -> missions.id
from_status string
to_status string
changed_by uuid
changed_at datetime

```

---

## 7. Grading (instructor screen, dynamic per mission)

**Form** — one block per trainee, one row per criterion from the mission's template.

```

Trainee: Cadet Verma

Tactics: [ Grade ▾: A ] Comment: ___________________
Speed: [ Grade ▾: B ] Comment: ___________________
Strength: [ Grade ▾: B ] Comment: ___________________

[ Save & Next Trainee ]

```

**List page** (dummy data — grading progress for "Land Nav Course 4")

| Trainee      | Criteria graded | Final grade | Status             | Actions          |
| ------------ | --------------- | ----------- | ------------------ | ---------------- |
| Cadet Verma  | 3/3             | —           | Pending evaluation | Review           |
| Cadet Sharma | 3/3             | —           | Pending evaluation | Review           |
| Cadet Iyer   | 1/3             | —           | In progress        | Continue grading |
| Cadet Nair   | 0/3             | —           | Not started        | Start grading    |

**Database**

```

criterion_scores
id uuid PK
mission_trainee_id uuid FK -> mission_trainees.id
template_criteria_id uuid FK -> template_criteria.id
grade_level_id uuid FK -> grade_levels.id
comments string
graded_by uuid
graded_at datetime

```

---

## 8. Final Grade / Evaluation

**Form**

```

Trainee: Cadet Verma
Computed Score: 3.4 (auto)
Computed Grade: B (auto)

Override Grade: [ Dropdown: -- keep B -- ▾ ]
Evaluator Comments (multi-line):

---

[ Confirm Evaluation ]

```

**List page** (dummy data)

| Trainee      | Final grade | Score | Evaluated by | Evaluated at  |
| ------------ | ----------- | ----- | ------------ | ------------- |
| Cadet Verma  | B           | 3.4   | Maj. Singh   | Sep 11, 09:00 |
| Cadet Sharma | A           | 3.8   | Maj. Singh   | Sep 11, 09:05 |
| Cadet Iyer   | C           | 2.1   | Maj. Singh   | Sep 11, 09:10 |

**Database**

```

final_grades
id uuid PK
mission_trainee_id uuid FK -> mission_trainees.id
computed_score float
final_grade_level_id uuid FK -> grade_levels.id
overridden_grade_level_id uuid FK -> grade_levels.id (nullable)
evaluator_comments string
evaluated_by uuid
evaluated_at datetime

```

---

## 9. Mission Close

No new form beyond a confirm dialog: "Close this mission? Grades will be locked." Triggers the status flip in Module 6.

**Database**

```

mission_reports (optional, if you want a generated summary export)
id uuid PK
mission_id uuid FK -> missions.id
file_path string
generated_at datetime

```

---

## Build order

1. Grading Criteria + Grading Scale (no dependencies)
2. Grading Template (depends on 1)
3. Mission Type (depends on 2)
4. Mission + Mission Trainees (depends on 3)
5. Lifecycle status transitions (depends on 4)
6. Grading screen (depends on 4, dynamic render from template)
7. Final Grade calculation (depends on 6)
8. Mission Close / reports (depends on 7)

```

```

## Grading Attribute

This module hold attributes for grading

### Example Item

- Tactics
- Strenght
- Flying
- Speed
- Takeoff

## Grade Scale

this store patter for scoring and scale template

### Example Scale

- Name: ABCF Scale
- Options:
  | Label | Min | Max |
  | ----- | --- | --- |
  | A     | 80  | 100 |
  | B     | 60  | 79  |
  | C     | 1   | 59  |
  | F     | 0   | 0   |

## Gradding Template

### Example Item

- Name: Flying Grading
- Scale: ABCD
- Attributes: Tactics, Strenght, Takeoff, Speed

## Test

### Example Test Data

- Name: Flying Aircraft For 1 Hour
- type: Flying
- Grade Template: Flying Grading (Scale ABCF)
- Grading Personnel X data
  - Tactics: A = 100
  - Strenght: C = 59
  - Takeoff: B = 79
  - Speed: F = 0
- Overall Score: 238/ 400 *100 = 59.5
- overall Grade: ????
