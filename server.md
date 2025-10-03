you has build a client app, and now you develop the server for it:
you has the following data model:
Task:
id:int
title:str
is_done:bool
content:str(default "")
create_time:datetime
update_time:datetime
begin_time:datetime or null
due_time:datetime or null
priority:int(range 0 to 9,default 5)
tags:list[str]
children:list[Task]
repeat:
times:int
(loop n times. automatically update title with format "title (nth time)" (the nth should be st/nd/rd/th according to n))
days:int or list[int]
int means loop every n days
list[int] means loop on these days of the week (0:Monday, 1:Tuesday, ..., 6:Sunday)
punishment:(what happened when unfinished)
delete:bool(default false)
highlight:bool(default true)
TaskList:
id:int
title:str
Notes:
id:int
content:str
create_time:datetime
update_time:datetime
tags:list[str]
you has the following api:
and now you should add sync system:
all the data should be stored in localStorage:an item for all tasks(only id), an item for all notes(only id), and each task an item,each note an item.
when loaded all the data:you can generate a hash for all of them.
use a interval to sync:
POST a.com/check/ with a json body {token,hash}
GET a.com/sync/ with json body "token" and get a json response "content"
POST a.com/sync with json body "token" and "content"
the content has 5 attribute:
tasks: all the task info
notes: all the note info
task_tag: the tag created for tasks
note_tag: the tag created for notes
time: a time stamp of when it is uploaded.
the content should be synced every time the info updated. and when there's a conflict just use the data with the later time.
POST a.com/login with json body username and password, response is json obj with "status"(success/failed) and token
develop this server with python and fastapi


---

重写这里面的代码,get_sync时接受queryparam参数from:int,只返回该时间戳之后的task/note. push_sync时同样接受querypararm from:int,将该时刻后的所有内容替换成新内容而该时刻前的不变. check时传入参数from,只对之后的task和note进行hash

同时修改hash方式为:每个task/note的每个字段先用simplehash hash掉他的值,然后这些哈希值相加得到单个task/note的hash,最后将所有hash再相加得到总hash

修改数据库存储方式改为userinfo里只存两种tag字段,并另外添加表tasks和表notes存储task和note的信息

---

