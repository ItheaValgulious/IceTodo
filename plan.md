  # Todo App

  ## Data Model

  datetime
  - year:int
  - month:int
  - day:int
  - time_stamp:int

  Task:
  - id:int
  - title:str
  - is_done:bool
  - content:str(default "")
  - create_time:datetime
  - update_time:datetime
  - begin_time:datetime or null
  - due_time:datetime or null
  - priority:int(range 0 to 9,default 5)
  - tags:list[str]
  - children:list[Task]
  - repeat:
      - times:int
        - (loop n times. automatically update title with format "title (nth time)" (the nth should be st/nd/rd/th according to n))
      - days:int or list[int]
        - int means loop every n days
        - list[int] means loop on these days of the week (0:Monday, 1:Tuesday, ..., 6:Sunday)
  - punishment:(what happened when unfinished)
    - delete:bool(default false)
    - highlight:bool(default true)

  TaskList:
  - id:int
  - title:str

  Notes:
  - id:int
  - content:str
  - create_time:datetime
  - update_time:datetime
  - tags:list[str]

  Configs:
  - sections:list[dict{title:str,items:list[dict{name:str,type:str,default:any}]}]

  ## Component

  Use Element Plus

  TaskWidget: A Widget to show the info of task
  - attribute:
    - show_done:bool(default true)
    - show_delete:bool(default true)
  - it display only title and due_time(if exists) and two button:
    - done:toggle button
    - delete:button
  - emit events when:
    - done:toggle button is clicked
    - delete:button is clicked
  - when clicked jump to Task edit page to edit the task.

  ListWidget: A Widget to show a list of tasks
  - it contains several items and just display them in a vertical list
  - it can be folded to show only the title of list
  - attributes:
    - title:str
    - foldable:bool(default true)
    - sortable:bool(default false)
    - items:list[TaskWidget or ListWidget]
    - folded:bool(default true)'
  - methods:
    - add_item(item:TaskWidget or ListWidget): add a new item to the end of items
    - remove_item(index:int): remove the item at index
    - toggle_fold(): toggle the folded attribute
    - sort_item(key:function(item:TaskWidget or ListWidget)->any, reverse:bool=False): sort the items by the attribute key in reverse order if reverse is True

  Nav Bar
  - it contains several buttons to switch to different pages
  - it is fixed at the bottom of the screen
  - emit events when:
    - switch:when a button is clicked to switch to a different page


  ## Pages

  ### My Day

  - header "My Day"
  - it contains a ListWidget to show the tasks of the day. unfoldable.

  ### Tasks

  - header "Tasks"
  - search bar: (default empty to show all) or show only tasks with title containing the search keyword
  - filter:
    - tags: a list of toggle button(each represents a tag) to check, and a button to add create new tag
    - priority: a number widget to input the priority range default 0 to 9
    - done/undone two toggle buttons to filter tasks.
  - it contains a ListWidget to show the tasks.

  ### Tags:

  - header "Tags"
  - it contains a ListWidget contains ListWidget. each sub-listWidget represents a tag, foldable.

  ### Calender

  - header "Calender"
  - A calender widget.

  ### Notes

  - header "Notes"
  - it contains a ListWidget to show the notes. each item is a text widget to show the content of note.
  - button to add a new note.

  ### Config

  - header "Config"
  - it contains a ListWidget to show the config items. each item is a toggle button(for bool) or a input box(for str) or a number widget(for int).

  ### Day edit
  - attribute:
    - date:datetime: the day to be edit.
  - header {Date}
  - it contains a ListWidget to show the tasks of the day. unfoldable.

  ### Note edit
  - attribute:
    - id:int the note to be edit.
  - header {Note title}
  - it contains a form to edit the note.
    - content:textarea widget
    - tags:a list of toggle button(each represents a tag) to check, and a button to add create new tag
    - a delete button

  ### Task edit
  - attribute:
    - id:int the task to be edit.
  - header {Task title}
  - it contains a form to edit the task.
    - name:text widget
    - is_done:toggle button
    - content:textarea widget
    - due_time:datetime widget
    - priority:number widget
    - tags:a list of toggle button(each represents a tag) to check, and a button to add create new tag
    - repeat:
      - times:number widget
      - days:
        - a toggle button says "loop" or "by week"
          - if "loop", then a number widget to input the loop times
          - if "by week", then a list of toggle button to select the days of the week
    - punishment:toggle button for each
    - children:
      -  a list of TaskWidget. 
      -  when clicked, it open a floating widget(like a window) to edit the children tasks. the window has a list of children, and a button to add a new child task.
    - a delete button


You should finish the project with native HTML/JS/CSS.

It should be a simple page application(SPA).

It should be able to sync: it saved data in indexDB, and can sync data by api:

www.test.com/sync/client_id?date=xx

the api will return a json object:
{
  tasks:[]
  notes:[],
  configs:[]
}

where tasks and notes are all created after date(by checking create_time).