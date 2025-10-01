# Todo App

## Data Model

datetime
- year:int
- month:int
- day:int
- time_stamp:int

Task:
- id:int 
- name:str
- is_done:bool
- content:str
- create_time:datetime
- update_time:datetime
- due_time:datetime
- priority:int
- tags:list[str]
- repeat:
    - times:int
      - (loop n times. automatically update name with format "name (nth time)" (the nth should be st/nd/rd/th according to n))
    - days:int or list[int]
      - int means loop every n days
      - list[int] means loop on these days of the week (0:Monday, 1:Tuesday, ..., 6:Sunday)
- punishment:(what happened when unfinished)
  - delete:bool
  - highlight:bool

TaskList:
- id:int
- name:str

Notes:
- id:int
- content:str
- create_time:datetime
- update_time:datetime
- tags:list[str]



## Component

### Text

A text box, when clicked become editable.

### Task

#### Data

## Pages

### My Day

### Tasks

### Calender

### Config