$(document).ready(function(){

  $(window).on('resize',checkWidth);

  $(".index-toggle-links").on('click',toggleIndex);

  $(document).on('click','.add-task', showForm);

  $(".tasks-list").on('click',".submit-task",checkAndSubmit);

  $(".tasks-list").on('click',".cancel-task",cancelTask);

  $(".tasks-list").on('click','.column1',addDeletedTaskToArchivedTasksTable);

  $(".first-row").on('click',insertAllTasks);

  $(".second-row").on('click',function(){
    showTodaysTasks(timeToday,0);
  });

  $('body').bind('mousewheel', function(e) {
    var $div = $('.main-body');
    $div.scrollTop($div.scrollTop()- e.originalEvent.wheelDelta);
    return false;
  });


  $(".third-row").on('click',function(){
    showTodaysTasks(timeInNext7Days,1);
  });
  $(".tasks-list").on('click',".column2",updateTask);

  tasksDb = window.openDatabase("tasksdatabase", "1.0", "WebSQL database", 5*1024*1024);
  instantiateDataBase();

  customizeDatePicker();
  checkWidth();
  insertAllTasks();
  updateLeftIndexTasksValue();

});
//        Global Variables        //
let currentDay = new Date();
currentDay.setHours(0);
currentDay.setMinutes(0);
currentDay.setSeconds(0);
let currentTimeInSeconds = currentDay.getTime()/1000;
let currentWeekday = currentDay.getDay();
let timeToday = currentTimeInSeconds + 60*60*24*1;
let timeInNext7Days = currentTimeInSeconds + 60*60*24*7;
let leftIndexItemClicked = -1;
let detachedFormGlobal = 0;
let weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"
  ,"Saturday"];
let globalRowId = 0,findDayValue=0;
let monthNames = ["Jan","Feb","Mar","Apr","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
let returnedDate=0,returnedTimeInSeconds=0,returnedWeekday=0;

//      All DB related functions here   //
function instantiateDataBase()
{
  createTableTaskList();
  createTableTaskDeleted();
}

function createTableTaskList(){
  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS tasks_list"+
        "(id INTEGER PRIMARY KEY AUTOINCREMENT"+
        ", taskinfo TEXT"+
        ", taskdate DATETIME)"
      )});
}

function createTableTaskDeleted(){
  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS deletedtasks"+
        "(id INTEGER PRIMARY KEY"+
        ", taskinfo TEXT"+
        ", taskdate DATETIME)"
      )});
}

function insertRowInDb(tInfo,tdate){
  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "INSERT INTO tasks_list(taskinfo,taskdate) VALUES(?,?)"
        ,[tInfo,tdate]
      )});
}

function updateRowInDb(rowId,tInfo,tdate){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[rowId]
        ,function(tx,result){
          if(tInfo.length!=0){
            tasksDb.transaction(
              function(tx){
                tx.executeSql("UPDATE tasks_list SET taskinfo=?, taskdate=? WHERE id=?"
                  ,[tInfo,tdate,rowId]);
              });
          }
        });
    });
}

function addDeletedTaskToArchivedTasksTable(){
  let taskToDelete = $(this).parent();
  let taskId = parseInt(taskToDelete.attr('id'));
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[taskId]
        ,function(tx,result){
          tx.executeSql("INSERT INTO deletedtasks(id,taskinfo,taskdate) VALUES(?,?,?)"
            ,[result.rows.item(0)["id"]
              ,result.rows.item(0)["taskinfo"]
              ,result.rows.item(0)["taskdate"]]
          );
        });
    });
  $(taskToDelete).remove();
  deleteTheRow(taskId);
  updateLeftIndexTasksValue();
  cancelTask();
}

function deleteTheRow(taskId){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("DELETE FROM tasks_list WHERE id = ?",
        [taskId])});
}

//   ////////////////////////////////////////////////////////////

function customizeDatePicker(){
  $(".task-date").datepicker({
    autoclose: true,
    clearBtn: true,
    format: 'd M yyyy',
    todayHighlight: true,
    startDate: new Date()
  });
}

function checkWidth(){
  let width = $(window).width();
  if(width<753){
    $(".index-toggle").show();
    $(".left-index").hide();
  }
  else if(width>=753){
    $(".index-toggle").hide();
    $(".left-index").show();
    if($(".fa-times").length>0){
      $(".index-toggle-links").removeClass("fa-times").addClass("fa-bars");
    }
  }
  if(width<820)
    $(".left-index ul").addClass("left-index-mobile-property");
  else
    $(".left-index ul").removeClass("left-index-mobile-property");
}

function toggleIndex(){
  if($(".left-index").css('display') === 'none'){
    $(".left-index").toggle();
    $(".left-index").removeClass("hidden-xs col-sm-4").addClass("left-index-toggle");
    $(".main-body").removeClass("col-xs-12").addClass("small-main-body");
    $(".index-toggle-links").addClass("fa-times").removeClass("fa-bars");
    $(".index-toggle-links").css({"color": "#fff","background-color":"#DB4C3F"});
  }
  else{
    $(".left-index").toggle();
    $(".left-index").removeClass("left-index-toggle").addClass("hidden-xs col-sm-4");
    $(".main-body").removeClass("small-main-body").addClass("col-xs-12");
    $(".index-toggle-links").removeClass("fa-times").addClass("fa-bars");
    $(".index-toggle-links").css({"background-color": "#DB4C3F","color":"#fff"});
  }
}

function showFormNext7Days(_this,detachedForm){
  cancelTask();
  $(_this).addClass("showParticularForm");
  $(detachedForm).insertAfter(".showParticularForm");
  if($(".add-task-form").css("display")=="none"){
    $(".add-task-form").css("display","block");
    showDefaultDate(_this);
  }
  else
    checkAndSubmit();
}

function showDefaultDate(_this){
  if(leftIndexItemClicked==2)
    $(".task-date").datepicker("setDate",new Date());
  else{
    let defaultDate = _this.prev().prev().find('.date-in-small').text();
    $(".task-date").datepicker("setDate",new Date(defaultDate));
  }
}

function showForm(){
  $(".add-task").removeClass("showParticularForm");
  $(".addtaskformcloned").remove();
  if($(".add-task-form").css("display")!="none")
    $(".add-task-form").css("display","none");
  let detachedForm = null;

  if($(".add-task").length>5){
    let _this = $(this);
    detachedFormGlobal = $(".add-task-form").detach();
    showFormNext7Days(_this,detachedFormGlobal);
  }
  else{
    if(detachedFormGlobal != 0){
      detachedForm = detachedFormGlobal;
      $(detachedForm).insertBefore('.add-task');
    }
    cancelTask();
    if($(".add-task-form").css("display")=="none"){
      $(".add-task-form").css("display","block");
      if(leftIndexItemClicked!=1){
        showDefaultDate();
      }
    }
    else {
      checkAndSubmit();
    }
  }
}

function decideWhichViewToUpdateAndShow(){
  if(leftIndexItemClicked==1)
    insertAllTasks();
  else if(leftIndexItemClicked==2)
    showTodaysTasks(timeToday,0);
  else if(leftIndexItemClicked==3)
    showTodaysTasks(timeInNext7Days,1);
}

function checkAndSubmit(){
  if($(".submit-task").text()!="Save"){
    console.log("should not be printed");
    if($(".task-info").val().length>0){
      let tInfo = $(".task-info").val();
      let tdate = $(".task-date").val();
      insertRowInDb(tInfo,tdate);
      cancelTask();
      decideWhichViewToUpdateAndShow();
    }
  }
  else{
    let rowId = parseInt(globalRowId);
    let tInfo = $(".task-info").val();
    let tdate = $(".task-date").val();
    if(tInfo.length>0){
      updateRowInDb(rowId,tInfo,tdate);
      updateLeftIndexTasksValue();
      $(".submit-task").text("Add Task");
      cancelTask();
      decideWhichViewToUpdateAndShow();
    }
  }
}

function checkIfAlreadyInserted(taskId){
  let searchtaskId = "#"+taskId;
  let value = $(searchtaskId).length==0?0:1;
  return value;
}

function cancelTask(){
  $(".add-task-form").css("display","none");
  $(".task-info").val('');
  $(".task-date").val('');
  if($(".submit-task").text()=="Save")
    $(".submit-task").text("Add Task");
}

function removePropertiesOfOtherView(){
  while($(".add-task").length>1)
    $(".add-task").not(":last").remove();
  if($(".weekday-names").length!=0)
    $(".weekday-names").remove();
  for(let i=7;i>=1;i--){
    let dayValue = ".day"+i;
    if($(dayValue).length!=0)
      $(dayValue).remove();
  }
  cancelTask();
  $(".main-title").remove();
  $(".all-the-tasks").remove();
  $(".over-due-today").remove();
  $(".today").remove();
  if(leftIndexItemClicked==1){
  }
}

function selectDateDisplay(rowdate,c3){
  manipulatereturnedDate(rowdate);
  if(returnedTimeInSeconds-currentTimeInSeconds<=1*60*60*24 && returnedTimeInSeconds>currentTimeInSeconds)
    $(c3).text("Today");
  else if(returnedTimeInSeconds-currentTimeInSeconds<=7*60*60*24 && returnedTimeInSeconds>=currentTimeInSeconds){
    if(returnedWeekday-currentWeekday==1 || returnedWeekday+7-currentWeekday==1){
      $(c3).text("Tomorrow");
      $(c3).css({"text-decoration":"underline","text-decoration-color":"#166CEC"});
    }
    else{
      $(c3).text(weekdays[returnedDate.getDay()]);
      $(c3).css({"text-decoration":"underline","text-decoration-color":"#FFB504"});
    }
  }
}

function setTableRows(trid,tInfo,tdate){
  for(let j=1;j<=3;j++)
    $(trid).append("<td class=column"+j+"></td>");
  let c1 =trid+">.column1";
  let c2 = trid+">.column2";
  let c3 = trid+">.column3";
  $(c1).append("<button></button>");
  $(c2).append(tInfo);
  $(c3).append(tdate);
  if(leftIndexItemClicked!=3){
    $(c2).css("border-bottom","1.5px solid #F0F0F0");
    $(c3).css("border-bottom","1.5px solid #F0F0F0");
  }
  return c3;
}

function insertInListInbox(rowId,tInfo,tdate){
  let taskId = parseInt(rowId);
  let val = 0;
  if(checkIfAlreadyInserted(taskId)==0){
    if($(".all-the-tasks").length == 0){
      $(".tasks-list").prepend("<table class=all-the-tasks></table>")
    }
    $(".all-the-tasks").append("<tr id="+taskId+"></tr>");
    let trid = "#"+taskId;
    val = setTableRows(trid,tInfo,tdate);
  }
  updateLeftIndexTasksValue();
  return val;
}

function insertAllTasks(){
  leftIndexItemClicked = 1;
  removePropertiesOfOtherView();
  $(".heading").append("<h4 class=main-title>Inbox</h4");
  cancelTask();
  $(this).siblings().css("background-color","#FAFAFA");
  $(this).css("background-color","#FFF");
  tasksDb.transaction(
    function(tx){
      tx.executeSql('SELECT * FROM tasks_list ORDER BY id'
        ,[ ]
        ,function(tx,result){
          for(let i=1;i<=result.rows.length;i++){
            let c3= insertInListInbox(result.rows.item(i-1)["id"],
              result.rows.item(i-1)["taskinfo"],result.rows.item(i-1)["taskdate"]);
            selectDateDisplay(result.rows.item(i-1)["taskdate"],c3);
          }
        });
    });
}

function updateLeftIndexTasksValue(){
  let target1 = ".first-row>h5";
  let target2 = ".second-row>h5";
  let target3 = ".trow>h5";
  $(".dynamic-numbers").remove();
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list"
        ,[ ]
        ,function(tx,result){
          let totaltasks=0, today=0, next7days=0;
          totaltasks = result.rows.length;
          for(let i=0;i<result.rows.length;i++){
            let rowdate = result.rows.item(i)["taskdate"];
            manipulatereturnedDate(rowdate);
            if(rowdate != ""){
              if(returnedTimeInSeconds-currentTimeInSeconds<=timeToday-currentTimeInSeconds && returnedTimeInSeconds>currentTimeInSeconds)
                today +=1;
              else if(returnedTimeInSeconds-currentTimeInSeconds<=timeInNext7Days-currentTimeInSeconds && returnedTimeInSeconds>currentTimeInSeconds)
                next7days +=1;
            }
          }
          if($(".dynamic-numbers").length==0){
            $(target1).append(" <div class=dynamic-numbers>"+ totaltasks+" </div>");
            $(target2).append(" <div class=dynamic-numbers>"+ today+" </div>");
            $(target3).append(" <div class=dynamic-numbers>"+ next7days +" </div>");
          }
        });
    });
}

function initializeTodayView(){
  leftIndexItemClicked = 2;
  $(".heading").append("<h4 class=main-title>Today</h4");
  if($(".over-due-today").length==0)
    $(".tasks-list").prepend("<div class=over-due-today><h4>Overdue</h4></div");
  if($(".today").length==0)
    $(".over-due-today").after("<div class=today><h4>Today</h4></div");
  $(".over-due-today").append("<table class=all-the-tasks></table>");
  $(".today").append("<table class=all-the-tasks></table>");
}

function initializeNext7DaysView(){
  leftIndexItemClicked = 3;
  $(".heading").append("<h4 class=main-title>Next 7 days</h4");
  for(let i=7;i>=1;i--){
    let dayValue = "day"+i;
    $(".tasks-list").prepend("<table class ="+dayValue+"></table>");
    findDayValue = "."+dayValue;
    $(".tasks-list").find(findDayValue).addClass("all-the-tasks");
    let index = (currentWeekday+(i))%7;
    let dateUpdated = currentDay;
    dateUpdated.setDate(dateUpdated.getDate()+i);
    $(".tasks-list").prepend("<h4 class=weekday-names>"+weekdays[index]+
      " <span class=date-in-small> "+dateUpdated.getDate()+" "+ monthNames[dateUpdated.getMonth()-1]+
      " "+dateUpdated.getFullYear()+"</span></h4>");
    dateUpdated.setDate(dateUpdated.getDate()-i);
  }
}

function createMultipleAddTasks(){
  let source = ".add-task";
  let temp = $(source);
  for(let i=1;i<=6;i++){
    let placeFormAt = ".day"+i;
    temp.clone().insertAfter(placeFormAt);
    let formClass = "form-of-table";
    $(placeFormAt).next().addClass(formClass);
  }
}

function manipulatereturnedDate(rowdate){
  returnedDate = new Date(rowdate);
  returnedDate.setMinutes(1);
  returnedTimeInSeconds = returnedDate.getTime()/1000;
  returnedWeekday = returnedDate.getDay();
}

function showTodaysTasks(timepassed,flag){
  removePropertiesOfOtherView();
  let leftIndexElement = ".second-row";
  if(flag==1)
    leftIndexElement = ".third-row";
  $(leftIndexElement).siblings().css("background-color","#FAFAFA");
  $(leftIndexElement).css("background-color","#FFF");
  tasksDb.transaction(
    function(tx){
      if(flag==0)
        initializeTodayView();
      else if(flag==1)
        initializeNext7DaysView();
      tx.executeSql("SELECT * FROM tasks_list"
        ,[ ]
        ,function(tx,result){
          if(result.rows.length != 0){
            for(let i=0;i<result.rows.length;i++){
              let rowdate = result.rows.item(i)["taskdate"];
              manipulatereturnedDate(rowdate);
              let taskId = result.rows.item(i)["id"];
              let trid = "#"+taskId;
              if(flag==0){
                if(returnedTimeInSeconds<currentTimeInSeconds)
                  $(".over-due-today table").append("<tr id="+taskId+"></tr>");
                else if(returnedTimeInSeconds-currentTimeInSeconds<=timepassed-currentTimeInSeconds)
                  $(".today table").append("<tr id="+taskId+"></tr>");
              }
              else if(flag==1){
                if(returnedTimeInSeconds-currentTimeInSeconds<timepassed-currentTimeInSeconds && returnedTimeInSeconds-currentTimeInSeconds>=60*60*24){
                  let dayConcerned = returnedWeekday-currentWeekday;
                  if(dayConcerned<0)
                    dayConcerned = dayConcerned+7;
                  let selectTable = ".day"+dayConcerned;
                  $(selectTable).append("<tr id="+taskId+"></tr>");
                }
              }
              setTableRows(trid,
                result.rows.item(i)["taskinfo"],result.rows.item(i)["taskdate"]);
            }
            createMultipleAddTasks();
          }
        });
    });
}

function showsaveform(){
  cancelTask();
  $(".submit-task").text("Save");
  if($(".add-task-form").css("display")=="none")
    $(".add-task-form").css("display","block");
}

function showInfoOnTaskToBeUpdatedInForm(rowId){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[rowId]
        ,function(tx,result){
          $(".task-info").val(result.rows.item(0)["taskinfo"]);
          $(".task-date").val(result.rows.item(0)["taskdate"]);
        });
    });
}

function updateTask(){
  cancelTask();
  let row = $(this).parent();
  showsaveform();
  globalRowId = row.attr('id');
  let rowId = globalRowId;
  showInfoOnTaskToBeUpdatedInForm(rowId);
}

