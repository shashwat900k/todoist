/*            Global Variables        */
let currentDay = new Date();
currentDay.setHours(0);
currentDay.setMinutes(0);
currentDay.setSeconds(0);
let currentTimeInSeconds = currentDay.getTime()/1000;
let currentWeekday = currentDay.getDay();
let timeToday = currentTimeInSeconds + 60*60*24*1;
let timeInNext7Days = currentTimeInSeconds + 60*60*24*7;
let leftIndexItemClicked = -1;
let weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let globalRowId = 0,findDayValue=0;
let monthNames = ["Jan","Feb","Mar","Apr","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
let returnedDate=0,returnedTimeInSeconds=0,returnedWeekday=0;
let returnedResultFromQuery = [];

/*            Document on ready function    */
$(document).ready(function(){

  $(window).on('resize',checkWidth);

  $(".index-toggle-links").on('click',toggleIndex);

  $('.add-task').on('click', showForm);

  $(document).on('click','.add-task-next7days',showForm);

  $(".submit-task").on('click',checkAndSubmit);

  $(".cancel-task").on('click',cancelTask);

  $(".tasks-list").on('click','.column1',addDeletedTaskToArchivedTasksTable);

  $(".first-row").on('click',insertAllTasks);

  $(".second-row").on('click',function(){
    showTodaysTasks(timeToday,"today");
  });
  $(".third-row").on('click',function(){
    showTodaysTasks(timeInNext7Days,"next7days");
  });

  $('body').bind('mousewheel', function(e) {
    var $div = $('.main-body');
    $div.scrollTop($div.scrollTop()- e.originalEvent.wheelDelta);
    return false;
  });

  $(".tasks-list").on('click',".column2",updateTask);

  tasksDb = window.openDatabase("tasksdatabase", "1.0", "WebSQL database", 5*1024*1024);
  instantiateDataBase();

  customizeDatePicker();
  checkWidth();
  insertAllTasks();
  updateLeftIndexTasksValue();

});

/*   All DB related functions here   */
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

function insertRowInDb(concernedTaskInfo,concernedTaskDate){
  tasksDb.transaction(
    function(tx){
      tx.executeSql(
        "INSERT INTO tasks_list(taskinfo,taskdate) VALUES(?,?)"
        ,[tInfo,concernedTaskDate]
      )});
}

function updateRowInDb(rowId,concernedTaskInfo,concernedTaskDate){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("SELECT * FROM tasks_list WHERE id = ?"
        ,[rowId]
        ,function(tx,result){
          if(concernedTaskInfo.length!=0){
            tasksDb.transaction(
              function(tx){
                tx.executeSql("UPDATE tasks_list SET taskinfo=?, taskdate=? WHERE id=?"
                  ,[tInfo,concernedTaskDate,rowId]);
              });
          }
        });
    });
}

function addDeletedTaskToArchivedTasksTable(){
  let taskToDelete = $(this).parent();
  let taskId = parseInt(taskToDelete.attr('class'));
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
  deleteRowInDb(taskId);
  updateLeftIndexTasksValue();
  cancelTask();
}

function deleteRowInDb(taskId){
  tasksDb.transaction(
    function(tx){
      tx.executeSql("DELETE FROM tasks_list WHERE id = ?",
        [taskId])});
}

function selectRowsFromDb(callback,timepassed=undefined,flag=undefined){
  returnedResultFromQuery = [];
  tasksDb.transaction(
    function(tx){
      tx.executeSql('SELECT * FROM tasks_list ORDER BY id'
        ,[ ],function(tx,result){
          for(let i=0;i<result.rows.length;i++){
            let row = result.rows.item(i);
            returnedResultFromQuery[i] = {
              id: row['id'],
              taskinfo: row['taskinfo'],
              taskdate: row['taskdate']
            };
          }
          if(timepassed==undefined)
            callback(returnedResultFromQuery);
          else
            callback(returnedResultFromQuery,timepassed,flag);
        });
    });
}
/*       Functions related to UI and responsiveness      */

function customizeDatePicker(){
  $(".task-date").datepicker({
    autoclose: true,
    clearBtn: true,
    format: 'd M yyyy',
    todayHighlight: true,
    startDate: new Date(),
    dayNames: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
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
    $(".index-toggle-links").addClass("fa-times").removeClass("fa-bars")
      .addClass("left-index-toggle-bars");
  }
  else{
    $(".left-index").toggle();
    $(".left-index").removeClass("left-index-toggle").addClass("hidden-xs col-sm-4");
    $(".main-body").removeClass("small-main-body").addClass("col-xs-12");
    $(".index-toggle-links").removeClass("fa-times").addClass("fa-bars")
      .removeClass("left-index-toggle-bars");
  }
}

function showDefaultDate(_this){
  if(leftIndexItemClicked=="todayView")
    $(".task-date").datepicker("setDate",new Date());
  else{
    let defaultDate = _this.prev().prev().find('.date-in-small').text();
    $(".task-date").datepicker("setDate",new Date(defaultDate));
  }
}

/*      Functions handling all the different events       */
function showForm(){
  let _this = $(this);
  $(".add-task-form").insertAfter(_this);
  $(".add-task-form").show();
  if(leftIndexItemClicked!="inboxView")
    showDefaultDate(_this);
}

function decideWhichListsOfTasksToShow(){
  if(leftIndexItemClicked=="inboxView")
    insertAllTasks();
  else if(leftIndexItemClicked=="todayView")
    showTodaysTasks(timeToday,"today");
  else if(leftIndexItemClicked=="next7DaysView")
    showTodaysTasks(timeInNext7Days,"next7days");
}

function checkAndSubmit(){
  let concernedTaskInfo = $(".task-info").val();
  let concernedTaskDate = $(".task-date").val();
  if($(".submit-task").text()!="Save"){
    console.log("should not be printed");
    if($(".task-info").val().length>0){
      insertRowInDb(concernedTaskInfo,concernedTaskDate);
      cancelTask();
      decideWhichListsOfTasksToShow();
    }
  }
  else{
    let rowId = parseInt(globalRowId);
    if(concernedTaskInfo.length>0){
      updateRowInDb(rowId,concernedTaskInfo,concernedTaskDate);
      updateLeftIndexTasksValue();
      $(".submit-task").text("Add Task");
      cancelTask();
      decideWhichListsOfTasksToShow();
    }
  }
}

function cancelTask(){
  $(".add-task-form").css("display","none");
  $(".task-info").val('');
  $(".task-date").val('');
  if($(".submit-task").text()=="Save")
    $(".submit-task").text("Add Task");
}

function removePropertiesOfOtherView(){
  cancelTask();
  $(".page-content").hide();
  $(".page-specific-heading").hide();
}

function selectDateDisplay(rowDate,columnContainingTaskDate){
  manipulatereturnedDate(rowDate);
  if(returnedTimeInSeconds-currentTimeInSeconds<=1*60*60*24 && returnedTimeInSeconds>currentTimeInSeconds)
    $(columnContainingTaskDate).text("Today");
  else if(returnedTimeInSeconds-currentTimeInSeconds<=7*60*60*24 && returnedTimeInSeconds>=currentTimeInSeconds){
    if(returnedWeekday-currentWeekday==1 || returnedWeekday+7-currentWeekday==1){
      $(columnContainingTaskDate).text("Tomorrow");
      $(columnContainingTaskDate).addClass("date-info-styling-tomorrow");
    }
    else{
      $(columnContainingTaskDate).text(weekdays[returnedDate.getDay()]);
      $(columnContainingTaskDate).addClass("date-info-styling-next7days");
    }
  }
}

function setTableRows(tableName,trid,concernedTaskInfo,concernedTaskDate){
  let rowTableCombination = tableName+">"+trid;
  for(let j=1;j<=3;j++)
    $(rowTableCombination).append("<td class=column"+j+"></td>");
  let columnContainingCheckbox =rowTableCombination+">.column1";
  let columnContainingTaskInfo = rowTableCombination+">.column2";
  let columnContainingTaskDate = rowTableCombination+">.column3";
  $(columnContainingCheckbox).html("<button></button>");
  $(columnContainingTaskInfo).html(concernedTaskInfo);
  $(columnContainingTaskDate).html(concernedTaskDate);
  if(leftIndexItemClicked!="next7DaysView"){
    $(columnContainingTaskInfo).addClass("task-info-border-styling");
    $(columnContainingTaskDate).addClass("task-info-border-styling");
  }
  return columnContainingTaskDate;
}

function insertRowInTable(tableName,rowId){
  $(tableName).append("<tr class="+rowId+"></tr>");
}

function checkIfAlreadyInserted(tableName,taskId){
  let searchtaskId = tableName+">"+"."+taskId;
  return $(searchtaskId).length==0?0:1;
}

function insertInListInbox(rowId,concernedTaskInfo,concernedTaskDate,tableName){
  let taskId = parseInt(rowId);
  let val = 0;
  if(checkIfAlreadyInserted(tableName,taskId)==0){
    insertRowInTable(tableName,taskId);
    let trid = "."+taskId;
    val = setTableRows(tableName,trid,concernedTaskInfo,concernedTaskDate);
  }
  updateLeftIndexTasksValue();
  return val;
}

function insertReturnedQueryResultsInTable(result){
  for(let i=1;i<=result.length;i++){
    let columnContainingTaskDate= insertInListInbox(result[i-1].id,
      result[i-1].taskinfo,result[i-1].taskdate,".all-the-tasks");
    selectDateDisplay(result[i-1].taskdate,columnContainingTaskDate);
  }
}

function insertAllTasks(){
  leftIndexItemClicked = "inboxView";
  removePropertiesOfOtherView();
  $(".inbox-heading").show();
  $(".content-index-page").show();
  cancelTask();
  $(this).siblings().addClass("background-color-not-selected-view").removeClass("background-color-selected-view");
  $(this).removeClass("background-color-not-selected-view").addClass("background-color-selected-view");
  selectRowsFromDb(insertReturnedQueryResultsInTable);
}

function updateNumberOfTasksInTheLeftIndexView(result){
  let totalNumberOfTasks = ".first-row>h5";
  let totalNumberOfTasksForToday = ".second-row>h5";
  let totalNumberOfTasksForNext7Days = ".third-row>h5";
  let totaltasks=0, today=0, next7days=0;
  totaltasks = result.length;
  for(let i=0;i<totaltasks;i++){
    let rowDate = result[i].taskdate;
    manipulatereturnedDate(rowDate);
    if(rowDate != ""){
      if(returnedTimeInSeconds-currentTimeInSeconds<=timeToday-currentTimeInSeconds && returnedTimeInSeconds>currentTimeInSeconds)
        today +=1;
      else if(returnedTimeInSeconds-currentTimeInSeconds<=timeInNext7Days-currentTimeInSeconds && returnedTimeInSeconds>currentTimeInSeconds)
        next7days +=1;
    }
  }
  if($(".dynamic-numbers").length==0){
    $(totalNumberOfTasks).append(" <div class=dynamic-numbers>"+ totaltasks+" </div>");
    $(totalNumberOfTasksForToday).append(" <div class=dynamic-numbers>"+ today+" </div>");
    $(totalNumberOfTasksForNext7Days).append(" <div class=dynamic-numbers>"+ next7days +" </div>");
  }
}

function updateLeftIndexTasksValue(){
  $(".dynamic-numbers").remove();
  selectRowsFromDb(updateNumberOfTasksInTheLeftIndexView);
}

function initializeTodayView(){
  leftIndexItemClicked = "todayView";
  $(".today-heading").show();
  $(".content-today-page").show();
  $(".add-task").show();
}

function initializeNext7DaysView(){
  leftIndexItemClicked = "next7DaysView";
  $(".add-task").show();
  $(".next7days-heading").show();
  $(".content-next7days-page").show();
  for(let i=7;i>=1;i--){
    let dayValue = "day"+i;
    let weekdayValue = ".weekday"+i;
    let index = (currentWeekday+(i))%7;
    let dateUpdated = currentDay;
    dateUpdated.setDate(dateUpdated.getDate()+i);
    $(weekdayValue).html(weekdays[index]+"<span class=date-in-small> "+dateUpdated.getDate()+" "+ monthNames[dateUpdated.getMonth()-1]+
      " "+dateUpdated.getFullYear()+"</span></h4>");
    dateUpdated.setDate(dateUpdated.getDate()-i);
  }
}

function createMultipleAddTasks(){
  if($(".add-task-next7days").length==0){
    for(let i=1;i<=7;i++){
      let placeFormAt = ".day"+i;
      $(".add-task").clone().insertAfter(placeFormAt);
      let placeFormAtChild = placeFormAt+"+.add-task";
      $(placeFormAtChild).removeClass("add-task").addClass("add-task-next7days");
    }
  }
  $(".add-task").hide();
}

function manipulatereturnedDate(rowDate){
  returnedDate = new Date(rowDate);
  returnedDate.setMinutes(1);
  returnedTimeInSeconds = returnedDate.getTime()/1000;
  returnedWeekday = returnedDate.getDay();
}

function showTodaysAndNext7DaysTasks(result,timepassed,flag){
  if(result.length != 0){
    for(let i=0;i<result.length;i++){
      let tableName = "";
      let rowDate = result[i].taskdate;
      manipulatereturnedDate(rowDate);
      let taskId = result[i].id;
      let trid = "."+taskId;
      if(flag=="today"){
        if(returnedTimeInSeconds<currentTimeInSeconds){
          tableName = ".overdue-tasks";
        }
        else if(returnedTimeInSeconds-currentTimeInSeconds<=timepassed-currentTimeInSeconds){
          tableName = ".todays-tasks";
        }
        if(checkIfAlreadyInserted(tableName,taskId)==0){
          insertRowInTable(tableName,taskId);
          setTableRows(tableName,trid,
            result[i].taskinfo,result[i].taskdate);
        }
      }
      else if(flag=="next7days"){
        if(returnedTimeInSeconds-currentTimeInSeconds<timepassed-currentTimeInSeconds && returnedTimeInSeconds-currentTimeInSeconds>=60*60*24){
          let dayConcerned = returnedWeekday-currentWeekday;
          if(dayConcerned<0)
            dayConcerned = dayConcerned+7;
          let selectTable = ".day"+dayConcerned;
          if(checkIfAlreadyInserted(selectTable,taskId)==0){
            $(selectTable).append("<tr class="+taskId+"></tr>");
            setTableRows(selectTable,trid,
              result[i].taskinfo,result[i].taskdate);
          }
        }
      }
    }
    if(flag=="next7days")
      createMultipleAddTasks();
  }
}

function showTodaysTasks(timepassed,flag){
  removePropertiesOfOtherView();
  let leftIndexElement = ".second-row";
  if(flag=="today")
    initializeTodayView();
  if(flag=="next7days"){
    leftIndexElement = ".third-row";
    initializeNext7DaysView();
  }
  $(leftIndexElement).siblings().addClass("background-color-not-selected-view").removeClass("background-color-selected-view");
  ;
  $(leftIndexElement).addClass("background-color-selected-view").removeClass("background-color-not-selected-view");
  selectRowsFromDb(showTodaysAndNext7DaysTasks,timepassed,flag);
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

